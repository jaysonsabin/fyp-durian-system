from fastapi import APIRouter, Depends, HTTPException, Response, status
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
def login(
    response: Response,  # Inject the Response object
    login_data: schemas.UserLogin, 
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == login_data.username).first()
    
    if not user or not security.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
    token = security.create_access_token(
        data={
            "sub": user.username,       
            "user_id": user.user_id,    
            "role": user.role.value if hasattr(user.role, 'value') else user.role, 
            "type": user.user_type
        }
    )
    
    # 1. Attach the token as a cookie
    response.set_cookie(
        key="durian_token",
        value=token,
        httponly=True,      # Crucial: Hides cookie from JavaScript (XSS safe)
        secure=False,       # Crucial: Only sends cookie over HTTPS (set False only for localhost HTTP testing)
        samesite="lax",     # Protects against CSRF attacks
        max_age=3600,       # Expires cookie after 1 hour (in seconds)
        path="/"            # Cookie is valid for all routes on our domain
    )
    
    # 2. Return user profile without sending the actual token string in the body
    return {"id": user.user_id, "username": user.username, "role": user.role}

@router.post("/register/admin", response_model=schemas.UserOut)
def register_admin(admin_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == admin_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_pwd = security.get_password_hash(admin_data.password)

    new_admin = models.Admin(
        full_name=admin_data.full_name,
        username=admin_data.username,
        password_hash=hashed_pwd, 
        role=models.UserRole.PENTADBIR, # Force role to admin
        permission=models.AdminPermission.CONTENT_MANAGER
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@router.post("/logout")
def logout(response: Response):
    # Overwrite the cookie with an expired date to clear it
    response.delete_cookie(key="durian_token", path="/")
    return {"message": "Successfully logged out"}

@router.get("/auth/me")
def get_current_user_session(current_user: dict = Depends(security.get_current_user)):
    return current_user