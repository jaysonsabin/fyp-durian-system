from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, security
from dependencies.db import get_db

router = APIRouter()

@router.post("/register/farmer", response_model=schemas.UserOut)
def register_farmer(farmer_data: schemas.FarmerCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == farmer_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_pwd = security.get_password_hash(farmer_data.password)

    new_farmer = models.Farmer(
        full_name=farmer_data.full_name,
        username=farmer_data.username,
        password_hash=hashed_pwd, 
        role=farmer_data.role,
        address=farmer_data.address
    )
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)
    return new_farmer

@router.post("/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    
    if not user or not security.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = security.create_access_token(
        data={
            "sub": user.username,       
            "user_id": user.user_id,    
            "role": user.role, 
            "type": user.user_type
        }
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.user_id 
    }