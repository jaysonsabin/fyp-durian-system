from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# Import your database, models, schemas, and the new security file!
import models, schemas, database, security
from database import engine

# ==========================================
# 1. INITIALIZATION & DATABASE SYNC
# ==========================================
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Durian Farm Management System")

# ==========================================
# 2. MIDDLEWARE (CORS)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allow_headers=["Content-Type", "Authorization"],
)

# ==========================================
# 3. ROOT ENDPOINT
# ==========================================
@app.get("/")
def root():
    return {"message": "Durian Farm API is officially online!"}

# ==========================================
# 4. AUTHENTICATION & USER PROFILE MANAGEMENT
# ==========================================
@app.post("/register/farmer", response_model=schemas.UserOut)
def register_farmer(farmer_data: schemas.FarmerCreate, db: Session = Depends(database.get_db)):
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

@app.post("/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
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

# FIXED: Moved out of login function scope and fixed indentation
@app.get("/users/{user_id}/profile")
def get_user_profile(
    user_id: int, 
    db: Session = Depends(database.get_db),
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

# NEW: PUT endpoint to permanently save profile modifications to PostgreSQL
@app.put("/users/{user_id}/profile")
def update_user_profile(
    user_id: int, 
    profile_update: schemas.ProfileUpdate, 
    db: Session = Depends(database.get_db),
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


# ==========================================
# 5. EXISTING ENDPOINTS (Farms & Logs) - SECURED
# ==========================================
@app.post("/farms", response_model=schemas.FarmOut)
def create_farm(farm_data: schemas.FarmCreate, db: Session = Depends(database.get_db)):
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
def create_activity_log(
    log_data: schemas.ActivityLogCreate, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(security.get_current_user) # <-- Secure Lock
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

    # 3. If ownership is verified, cleanly map data fields and commit to table
    new_log = models.ActivityLog(**log_data.model_dump())
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@app.get("/farms/{farm_id}/logs", response_model=List[schemas.ActivityLogOut])
def get_farm_logs(
    farm_id: int, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(security.get_current_user) # <-- Secure Lock
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


# ==========================================
# 6. ELIBRARY ENDPOINTS
# ==========================================
@app.post("/library", response_model=schemas.LibraryContentOut)
def create_library_content(content: schemas.LibraryContentCreate, db: Session = Depends(database.get_db)):
    admin = db.query(models.Admin).filter(models.Admin.user_id == content.admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    new_content = models.LibraryContent(**content.model_dump())
    db.add(new_content)
    db.commit()
    db.refresh(new_content)
    return new_content

@app.get("/library", response_model=List[schemas.LibraryContentOut])
def get_all_content(db: Session = Depends(database.get_db)):
    return db.query(models.LibraryContent).order_by(models.LibraryContent.date_published.desc()).all()


# ==========================================
# 7. CONTENT INTERACTIONS
# ==========================================
@app.post("/library/interaction", response_model=schemas.InteractionOut)
def record_interaction(interaction: schemas.InteractionCreate, db: Session = Depends(database.get_db)):
    content = db.query(models.LibraryContent).filter(models.LibraryContent.content_id == interaction.content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == interaction.farmer_id).first()
    if not farmer:
         raise HTTPException(status_code=404, detail="Farmer not found")

    new_interaction = models.ContentInteraction(**interaction.model_dump())
    db.add(new_interaction)
    db.commit()
    db.refresh(new_interaction)
    return new_interaction