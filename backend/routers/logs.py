from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, security
from dependencies.db import get_db

router = APIRouter()

@router.post("/logs", response_model=schemas.ActivityLogOut)
def create_activity_log(
    log_data: schemas.ActivityLogCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    # 1. Look up the targeted farm asset row in your database
    target_farm = db.query(models.Farm).filter(models.Farm.farm_id == log_data.farm_id).first()
    
    if not target_farm:
        raise HTTPException(status_code=404, detail="Target plantation asset not found.")

    # 2. Relational Security Check: Verify that this farm belongs to the logged-in current_user
    if target_farm.farmer_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. You do not own this plantation partition."
        )

    # 3. Deduplication Check: Prevent duplicate submissions created within a short time window (e.g., 30 seconds)
    from sqlalchemy import func, text
    recent_duplicate = db.query(models.ActivityLog).filter(
        models.ActivityLog.farm_id == log_data.farm_id,
        models.ActivityLog.activity_type == log_data.activity_type,
        models.ActivityLog.fertilizer_type == log_data.fertilizer_type,
        models.ActivityLog.fertilizer_amount == float(log_data.fertilizer_amount),
        models.ActivityLog.pest_control == log_data.pest_control,
        models.ActivityLog.soil_ph == float(log_data.soil_ph),
        models.ActivityLog.remarks == log_data.remarks,
        models.ActivityLog.log_date >= (func.now() - text("interval '30 seconds'"))
    ).first()

    if recent_duplicate:
        print(f"[Deduplication] Duplicate log detected! Returning existing log_id: {recent_duplicate.log_id}")
        return recent_duplicate

    # 4. If ownership and uniqueness are verified, cleanly map data fields and commit to table
    log_dict = log_data.model_dump()
    
    # Auto-enrich weather metrics retrospectively if they were submitted as offline placeholders (0.0)
    if (log_dict.get("temperature") == 0.0 and log_dict.get("rainfall") == 0.0) or \
       (log_dict.get("temperature") is None and log_dict.get("rainfall") is None):
        if target_farm.latitude is not None and target_farm.longitude is not None:
            try:
                from services.weather import fetch_current_weather
                weather = fetch_current_weather(target_farm.latitude, target_farm.longitude)
                log_dict["temperature"] = weather.get("temperature", 28.5)
                log_dict["rainfall"] = weather.get("rainfall", 0.0)
            except Exception as e:
                # Fallback to standard defaults on error
                log_dict["temperature"] = 28.5
                log_dict["rainfall"] = 0.0
        else:
            log_dict["temperature"] = 28.5
            log_dict["rainfall"] = 0.0

    new_log = models.ActivityLog(**log_dict)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/farms/{farm_id}/logs", response_model=List[schemas.ActivityLogOut])
def get_farm_logs(
    farm_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    # 1. Fetch the farm from the database to see who owns it
    farm = db.query(models.Farm).filter(models.Farm.farm_id == farm_id).first()
    
    if not farm:
        raise HTTPException(status_code=404, detail="Farm plantation partition not found.")

    # 2. Relational Security Check: Does this farm actually belong to the logged-in current_user?
    if farm.farmer_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. You do not have permission to view this farm's history matrices."
        )

    # 3. Secure clearance granted: Return the matching activity log table rows
    return db.query(models.ActivityLog)\
             .filter(models.ActivityLog.farm_id == farm_id)\
             .all()

@router.put("/logs/{log_id}", response_model=schemas.ActivityLogOut)
def update_activity_log(
    log_id: int,
    log_data: schemas.ActivityLogUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    log = db.query(models.ActivityLog).filter(models.ActivityLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity log not found")
    
    # Verify owner of the farm matches current user
    farm = db.query(models.Farm).filter(models.Farm.farm_id == log.farm_id).first()
    if not farm or farm.farmer_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. You do not own this plantation partition."
        )

    log.fertilizer_type = log_data.fertilizer_type
    log.fertilizer_amount = log_data.fertilizer_amount
    log.pest_control = log_data.pest_control
    log.activity_type = log_data.activity_type
    log.temperature = log_data.temperature
    log.rainfall = log_data.rainfall
    log.soil_ph = log_data.soil_ph
    log.remarks = log_data.remarks

    db.commit()
    db.refresh(log)
    return log

@router.delete("/logs/{log_id}")
def delete_activity_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    log = db.query(models.ActivityLog).filter(models.ActivityLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity log not found")
        
    farm = db.query(models.Farm).filter(models.Farm.farm_id == log.farm_id).first()
    if not farm or farm.farmer_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. You do not own this plantation partition."
        )

    db.delete(log)
    db.commit()
    return {"status": "success", "message": "Activity log record deleted successfully."}