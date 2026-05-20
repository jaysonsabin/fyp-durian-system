from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from dependencies.db import get_db

router = APIRouter()

@router.get("/library", response_model=List[schemas.LibraryContentOut])
def get_all_content(db: Session = Depends(get_db)):
    return db.query(models.LibraryContent).order_by(models.LibraryContent.date_published.desc()).all()

@router.post("/library", response_model=schemas.LibraryContentOut)
def create_library_content(content: schemas.LibraryContentCreate, db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.user_id == content.admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    new_content = models.LibraryContent(**content.model_dump())
    db.add(new_content)
    db.commit()
    db.refresh(new_content)
    return new_content

@router.post("/library/interaction", response_model=schemas.InteractionOut)
def record_interaction(interaction: schemas.InteractionCreate, db: Session = Depends(get_db)):
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

