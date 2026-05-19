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
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 3. ROOT ENDPOINT
# ==========================================
@app.get("/")
def root():
    return {"message": "Durian Farm API is officially online!"}

# ==========================================
# 4. AUTHENTICATION (Register & Login)
# ==========================================
@app.post("/register/farmer", response_model=schemas.UserOut)
def register_farmer(farmer_data: schemas.FarmerCreate, db: Session = Depends(database.get_db)):
    # 1. Check if username already exists to prevent duplicates
    existing_user = db.query(models.User).filter(models.User.username == farmer_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # 2. Hash the password before saving
    hashed_pwd = security.get_password_hash(farmer_data.password)

    # 3. Create the farmer with the hashed password
    new_farmer = models.Farmer(
        full_name=farmer_data.full_name,
        username=farmer_data.username, # Make sure this is in your models.py!
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
    # 1. Find the user by username
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    
    # 2. Verify user exists AND password matches
    if not user or not security.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # 3. Generate the JWT containing their ID and Role
    access_token = security.create_access_token(
        data={"sub": str(user.user_id), "role": user.role, "type": user.user_type}
    )
    
    # Return the token to the Next.js frontend
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# 5. EXISTING ENDPOINTS (Farms & Logs)
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
def create_activity_log(log_data: schemas.ActivityLogCreate, db: Session = Depends(database.get_db)):
    new_log = models.ActivityLog(**log_data.model_dump())
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@app.get("/farms/{farm_id}/logs", response_model=List[schemas.ActivityLogOut])
def get_farm_logs(farm_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.ActivityLog).filter(models.ActivityLog.farm_id == farm_id).all()


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