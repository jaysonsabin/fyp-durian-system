from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
import security
from dependencies.db import get_db

router = APIRouter(prefix="/forum", tags=["Forum"])

@router.post("/posts", response_model=schemas.ForumPostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: schemas.ForumPostCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    new_post = models.ForumPost(
        user_id=current_user["id"],
        title=post_data.title,
        content=post_data.content,
        tag=post_data.tag or "General",
        image_url=post_data.image_url,
        status="Active"
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.get("/posts", response_model=List[schemas.ForumPostOut])
def list_posts(
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(security.get_current_user_optional)
):
    query = db.query(models.ForumPost)
    if tag and tag != "All":
        query = query.filter(models.ForumPost.tag == tag)
    if search:
        query = query.filter(
            (models.ForumPost.title.ilike(f"%{search}%")) |
            (models.ForumPost.content.ilike(f"%{search}%"))
        )
    
    # Hide hidden posts unless the user is an Admin (role == "Pentadbir")
    if not current_user or current_user.get("role") != models.UserRole.PENTADBIR.value:
        query = query.filter(models.ForumPost.status != "Hidden")
        
    return query.order_by(models.ForumPost.created_at.desc()).all()

@router.get("/posts/{post_id}", response_model=schemas.ForumPostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.ForumPost).filter(models.ForumPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post

@router.put("/posts/{post_id}", response_model=schemas.ForumPostOut)
def update_post(
    post_id: int,
    post_data: schemas.ForumPostUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. You do not own this post."
        )
    post.title = post_data.title
    post.content = post_data.content
    post.tag = post_data.tag or "General"
    post.image_url = post_data.image_url
    db.commit()
    db.refresh(post)
    return post

@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != current_user["id"] and current_user.get("role") != models.UserRole.PENTADBIR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. You do not own this post and are not an admin."
        )
    db.delete(post)
    db.commit()
    return {"status": "success", "message": "Post deleted successfully."}

@router.post("/posts/{post_id}/react")
def toggle_reaction(
    post_id: int,
    reaction_data: schemas.ForumReactionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    reaction = db.query(models.ForumReaction).filter(
        models.ForumReaction.post_id == post_id,
        models.ForumReaction.user_id == current_user["id"]
    ).first()

    if reaction:
        db.delete(reaction)
        db.commit()
        return {"status": "removed", "message": "Reaction removed."}
    else:
        new_reaction = models.ForumReaction(
            post_id=post_id,
            user_id=current_user["id"],
            reaction_type=reaction_data.reaction_type
        )
        db.add(new_reaction)
        db.commit()
        db.refresh(new_reaction)
        return new_reaction

@router.delete("/posts/{post_id}/react")
def remove_reaction(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    reaction = db.query(models.ForumReaction).filter(
        models.ForumReaction.post_id == post_id,
        models.ForumReaction.user_id == current_user["id"]
    ).first()
    if not reaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reaction not found")
    db.delete(reaction)
    db.commit()
    return {"status": "success", "message": "Reaction removed."}

@router.post("/posts/{post_id}/replies", response_model=schemas.ForumReplyOut, status_code=status.HTTP_201_CREATED)
def create_reply(
    post_id: int,
    reply_data: schemas.ForumReplyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.status == "Locked" and current_user.get("role") != "Pentadbir":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reply to a locked post."
        )
    new_reply = models.ForumReply(
        post_id=post_id,
        user_id=current_user["id"],
        reply_content=reply_data.reply_content
    )
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)
    return new_reply

@router.put("/replies/{reply_id}", response_model=schemas.ForumReplyOut)
def update_reply(
    reply_id: int,
    reply_data: schemas.ForumReplyUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    reply = db.query(models.ForumReply).filter(models.ForumReply.reply_id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
    if reply.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. You do not own this reply."
        )
    reply.reply_content = reply_data.reply_content
    db.commit()
    db.refresh(reply)
    return reply

@router.delete("/replies/{reply_id}")
def delete_reply(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    reply = db.query(models.ForumReply).filter(models.ForumReply.reply_id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
    if reply.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. You do not own this reply."
        )
    db.delete(reply)
    db.commit()
    return {"status": "success", "message": "Reply deleted successfully."}

@router.put("/posts/{post_id}/lock", response_model=schemas.ForumPostOut)
def lock_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    if current_user.get("role") != models.UserRole.PENTADBIR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Only admins can lock/unlock posts."
        )
    post = db.query(models.ForumPost).filter(models.ForumPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Toggle status between Active and Locked
    if post.status == "Locked":
        post.status = "Active"
    else:
        post.status = "Locked"
        
    db.commit()
    db.refresh(post)
    return post

@router.put("/posts/{post_id}/hide", response_model=schemas.ForumPostOut)
def hide_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_current_user)
):
    if current_user.get("role") != models.UserRole.PENTADBIR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Only admins can hide/unhide posts."
        )
    post = db.query(models.ForumPost).filter(models.ForumPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Toggle status between Active and Hidden
    if post.status == "Hidden":
        post.status = "Active"
    else:
        post.status = "Hidden"
        
    db.commit()
    db.refresh(post)
    return post
