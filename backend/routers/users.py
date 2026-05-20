from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models, schemas, security
from dependencies.db import get_db

router = APIRouter()

@router.get("/users/{user_id}/profile")
def get_user_profile(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to profile data.")
        
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == user_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found.")
        
    return {
        "full_name": farmer.full_name,
        "address": farmer.address
    }

@router.put("/users/{user_id}/profile")
def update_user_profile(
    user_id: int, 
    profile_update: schemas.ProfileUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized profile alteration.")
        
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == user_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer record missing.")
        
    # Update the model attributes
    farmer.full_name = profile_update.full_name
    farmer.address = profile_update.address
    
    db.commit()
    db.refresh(farmer)
    
    return {"status": "success", "message": "Profile updated successfully."}