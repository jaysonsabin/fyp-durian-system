from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
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