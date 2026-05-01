from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database


# 1. Initialize the App (ONLY ONCE)
app = FastAPI(title="Durian Farm Management System")

# 2. Add Security/CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Root Endpoint (Home)
@app.get("/")
def root():
    return {"message": "Durian Farm API is officially online!"}

# 4. Registration Endpoint
@app.post("/register/farmer", response_model=schemas.UserOut)
def register_farmer(farmer_data: schemas.FarmerCreate, db: Session = Depends(database.get_db)):
    # Create the new Farmer object based on your models.py
    new_farmer = models.Farmer(
        full_name=farmer_data.full_name,
        password_hash=farmer_data.password, # Note: We will hash this later!
        role=farmer_data.role,
        address=farmer_data.address
    )
    
    # Save to PostgreSQL
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)
    
    return new_farmer

@app.post("/farms", response_model=schemas.FarmOut)
def create_farm(farm_data: schemas.FarmCreate, db: Session = Depends(database.get_db)):
    # Create the new Farm object
    new_farm = models.Farm(
        farm_name=farm_data.farm_name,
        farm_location=farm_data.farm_location,
        farmer_id=farm_data.farmer_id
    )
    
    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)
    return new_farm

@app.get("/farms/{farmer_id}", response_model=List[schemas.FarmOut])
def get_farmer_farms(farmer_id: int, db: Session = Depends(database.get_db)):
    farms = db.query(models.Farm).filter(models.Farm.farmer_id == farmer_id).all()
    return farms

@app.post("/logs", response_model=schemas.ActivityLogOut)
def create_activity_log(log_data: schemas.ActivityLogCreate, db: Session = Depends(database.get_db)):
    new_log = models.ActivityLog(**log_data.model_dump())
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

# Endpoint to see all logs for a specific farm
@app.get("/farms/{farm_id}/logs", response_model=List[schemas.ActivityLogOut])
def get_farm_logs(farm_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.ActivityLog).filter(models.ActivityLog.farm_id == farm_id).all()