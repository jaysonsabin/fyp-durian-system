from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

import models
import schemas
import security
from dependencies.db import get_db
from services.ml_models import train_and_evaluate_models

router = APIRouter()

@router.get("/farms/{farm_id}/yield-prediction", response_model=schemas.YieldPredictionResponse)
def get_yield_prediction(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    # 1. Fetch farm and verify security clearance
    farm = db.query(models.Farm).filter(models.Farm.farm_id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Farm plantation not found"
        )
    
    # Allow farm owner or Admin to view predictions
    if farm.farmer_id != current_user["id"] and current_user["role"] != "Pentadbir":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. You do not own this farm context."
        )

    # 2. Extract and average activity log statistics for baseline features
    logs = db.query(models.ActivityLog).filter(models.ActivityLog.farm_id == farm_id).all()
    if not logs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No activity logs found for this farm. Please add at least one activity log."
        )
    
    avg_temp = sum(log.temperature for log in logs) / len(logs)
    avg_rain = sum(log.rainfall for log in logs) / len(logs)
    avg_ph = sum(log.soil_ph for log in logs) / len(logs)
    avg_fert = sum(log.fertilizer_amount for log in logs) / len(logs)

    derived_inputs = {
        "temperature": round(avg_temp, 2),
        "rainfall": round(avg_rain, 2),
        "soil_ph": round(avg_ph, 2),
        "fertilizer": round(avg_fert, 2)
    }

    # 3. Train the ML models on the historical dataset
    lr_model, rf_model, scaler, lr_acc, rf_acc = train_and_evaluate_models()

    # 4. Run inference with both models after scaling the derived inputs
    features = [[avg_temp, avg_rain, avg_ph, avg_fert]]
    features_scaled = scaler.transform(features)
    lr_yield = lr_model.predict(features_scaled)[0]
    rf_yield = rf_model.predict(features_scaled)[0]

    # Calculate Grade A, B, C breakdown based on pH optimality
    def calculate_breakdown(predicted_yield, ph_val):
        ph_dev = abs(ph_val - 6.3)
        if ph_dev < 0.3:
            a_pct, b_pct, c_pct = 0.65, 0.25, 0.10
        elif ph_dev < 0.8:
            a_pct, b_pct, c_pct = 0.55, 0.30, 0.15
        else:
            a_pct, b_pct, c_pct = 0.40, 0.40, 0.20
        
        return (
            round(predicted_yield * a_pct, 2),
            round(predicted_yield * b_pct, 2),
            round(predicted_yield * c_pct, 2)
        )

    lr_a, lr_b, lr_c = calculate_breakdown(lr_yield, avg_ph)
    rf_a, rf_b, rf_c = calculate_breakdown(rf_yield, avg_ph)

    # 5. Generate intelligent recommendation details
    recs = []
    if avg_ph < 6.0:
        recs.append("Soil is acidic. Apply ground agricultural lime (calcium carbonate) or dolomite to raise soil pH toward the optimal 6.0-6.5 range for durian.")
    elif avg_ph > 6.8:
        recs.append("Soil is slightly alkaline. Use ammonium sulfate or sulfur-coated urea to gently lower pH to the optimal range.")
    
    if avg_temp > 32.0:
        recs.append("High temperature detected. Increase watering frequency and consider misting/shading to prevent heat stress on durian flowers.")
    elif avg_temp < 24.0:
        recs.append("Cooler temperature environment. Monitor for slower growth rates and adjust irrigation downwards to prevent root rot.")

    if avg_rain < 100.0:
        recs.append("Low monthly rainfall simulated. Ensure active irrigation lines are functioning to supplement moisture.")
    elif avg_rain > 250.0:
        recs.append("Heavy rainfall. Ensure excellent field drainage to prevent waterlogging and combat fungal diseases like phytophthora.")

    if avg_fert < 80.0:
        recs.append("Low fertilizer level. Consider increasing NPK 15-15-15 dosage during active vegetative phases.")
    elif avg_fert > 180.0:
        recs.append("High fertilizer dosage. Monitor for leaf burn or nutrient toxicity. Flush soil if necessary.")
     
    if not recs:
        recs.append("Optimal conditions! Maintain the current management plan and schedule regular crop health monitoring.")
     
    recommendation = " ".join(recs)

    # 6. Package and return the response
    return schemas.YieldPredictionResponse(
        farm_id=farm_id,
        farm_name=farm.farm_name,
        derived_inputs=derived_inputs,
        linear_regression=schemas.ModelPredictionDetails(
            yield_predicted=round(lr_yield, 2),
            grade_a=lr_a,
            grade_b=lr_b,
            grade_c=lr_c,
            accuracy=lr_acc
        ),
        random_forest=schemas.ModelPredictionDetails(
            yield_predicted=round(rf_yield, 2),
            grade_a=rf_a,
            grade_b=rf_b,
            grade_c=rf_c,
            accuracy=rf_acc
        ),
        recommendation=recommendation
    )
