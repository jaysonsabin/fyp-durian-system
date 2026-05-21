from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
import security
from dependencies.db import get_db
from services.weather import fetch_current_weather

router = APIRouter()

@router.get("/farms/{farm_id}/current-weather", response_model=schemas.WeatherOut)
def get_current_weather(
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
    
    # Allow farm owner or Admin to view weather
    if farm.farmer_id != current_user["id"] and current_user["role"] != "Pentadbir":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. You do not own this farm context."
        )

    # 2. Fetch current weather using coordinates
    weather_data = fetch_current_weather(farm.latitude, farm.longitude)
    return weather_data
