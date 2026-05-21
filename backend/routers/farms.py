from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, security
from dependencies.db import get_db

router = APIRouter()

@router.post("/farms", response_model=schemas.FarmOut)
def create_farm(farm_data: schemas.FarmCreate, db: Session = Depends(get_db)):
    new_farm = models.Farm(
        farm_name=farm_data.farm_name,
        farm_location=farm_data.farm_location,
        farmer_id=farm_data.farmer_id
    )
    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)
    return new_farm

@router.get("/farms/{farmer_id}", response_model=List[schemas.FarmOut])
def get_farmer_farms(farmer_id: int, db: Session = Depends(get_db)):
    farms = db.query(models.Farm).filter(models.Farm.farmer_id == farmer_id).all()
    return farms

@router.put("/farms/{farm_id}", response_model=schemas.FarmOut)
def update_farm(
    farm_id: int,
    farm_data: schemas.FarmUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    farm = db.query(models.Farm).filter(models.Farm.farm_id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.farmer_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. You do not own this plantation."
        )
    farm.farm_name = farm_data.farm_name
    farm.farm_location = farm_data.farm_location
    db.commit()
    db.refresh(farm)
    return farm

@router.delete("/farms/{farm_id}")
def delete_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    farm = db.query(models.Farm).filter(models.Farm.farm_id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.farmer_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. You do not own this plantation."
        )
    db.delete(farm)
    db.commit()
    return {"status": "success", "message": "Farm and all its records deleted permanently."}