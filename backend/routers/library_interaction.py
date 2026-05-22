from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models, schemas, security
from dependencies.db import get_db

router = APIRouter()

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
