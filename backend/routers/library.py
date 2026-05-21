from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, security
from dependencies.db import get_db

router = APIRouter()

@router.get("/library", response_model=List[schemas.LibraryContentOut])
def get_all_content(db: Session = Depends(get_db)):
    return db.query(models.LibraryContent).order_by(models.LibraryContent.date_published.desc()).all()

@router.post("/library", response_model=schemas.LibraryContentOut)
def create_library_content(
    content: schemas.LibraryContentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    if current_user.get("role") != models.UserRole.PENTADBIR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Only admins can create content."
        )
    
    admin = db.query(models.Admin).filter(models.Admin.user_id == current_user["id"]).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")

    content_dict = content.model_dump()
    content_dict["admin_id"] = current_user["id"]
    new_content = models.LibraryContent(**content_dict)
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

    # Prevent duplicates for Likes and Bookmarks
    if interaction.interaction_type in ["Liked", "Bookmarked"]:
        existing = db.query(models.ContentInteraction).filter(
            models.ContentInteraction.content_id == interaction.content_id,
            models.ContentInteraction.farmer_id == interaction.farmer_id,
            models.ContentInteraction.interaction_type == interaction.interaction_type
        ).first()
        if existing:
            return existing

    new_interaction = models.ContentInteraction(**interaction.model_dump())
    db.add(new_interaction)
    db.commit()
    db.refresh(new_interaction)
    return new_interaction

@router.delete("/library/interaction")
def delete_interaction(
    content_id: int,
    farmer_id: int,
    interaction_type: str,
    db: Session = Depends(get_db)
):
    interaction = db.query(models.ContentInteraction).filter(
        models.ContentInteraction.content_id == content_id,
        models.ContentInteraction.farmer_id == farmer_id,
        models.ContentInteraction.interaction_type == interaction_type
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    db.delete(interaction)
    db.commit()
    return {"status": "success", "message": "Interaction deleted successfully"}

@router.put("/library/{content_id}", response_model=schemas.LibraryContentOut)
def update_library_content(
    content_id: int,
    content_data: schemas.LibraryContentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    if current_user.get("role") != models.UserRole.PENTADBIR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Only admins can update library contents."
        )
    
    content = db.query(models.LibraryContent).filter(models.LibraryContent.content_id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Library content not found")
        
    content.title = content_data.title
    content.type = content_data.type
    content.category = content_data.category
    content.description = content_data.description
    content.media_url = content_data.media_url
    content.published_by = content_data.published_by
    
    db.commit()
    db.refresh(content)
    return content

@router.delete("/library/{content_id}")
def delete_library_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    if current_user.get("role") != models.UserRole.PENTADBIR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Only admins can delete library contents."
        )
        
    content = db.query(models.LibraryContent).filter(models.LibraryContent.content_id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Library content not found")
        
    db.delete(content)
    db.commit()
    return {"status": "success", "message": "Content deleted successfully"}

