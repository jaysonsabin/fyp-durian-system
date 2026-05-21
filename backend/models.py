import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Enum as SqlEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base 

# Define Enums for data integrity
class UserRole(str, enum.Enum):
    PENTADBIR = "Pentadbir"
    PENGUSAHA = "Pengusaha"

class FertilizerBrand(str, enum.Enum):
    NPK_15_15_15 = "NPK 15-15-15"
    NPK_12_12_17 = "NPK 12-12-17"
    ORGANIC = "Organic"
    NONE = "None"

class AdminPermission(str, enum.Enum):
    SUPERADMIN = "Superadmin"           # Full access to everything
    CONTENT_MANAGER = "Content Manager" # Can only manage eLibrary and Forums
    MODERATOR = "Moderator"             # Can only moderate forum discussions

class User(Base):
    __tablename__ = "users"
    username = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SqlEnum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user_type = Column(String(50))
    __mapper_args__ = {"polymorphic_identity": "user", "polymorphic_on": user_type}

class Farmer(User):
    __tablename__ = "farmers"
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    address = Column(String(255), nullable=True)
    __mapper_args__ = {"polymorphic_identity": "farmer"}
    farms = relationship("Farm", back_populates="owner")

class Admin(User):
    __tablename__ = "admins"
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    permission = Column(SqlEnum(AdminPermission), default=AdminPermission.CONTENT_MANAGER, nullable=False)
    
    __mapper_args__ = {"polymorphic_identity": "admin"}

    # An admin can upload many library contents
    uploaded_contents = relationship("LibraryContent", back_populates="admin")

class Farm(Base):
    __tablename__ = "farms"
    farm_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.user_id"), nullable=False)
    farm_name = Column(String(120), nullable=False)
    farm_location = Column(String(255), nullable=False)
    owner = relationship("Farmer", back_populates="farms")
    logs = relationship("ActivityLog", back_populates="farm", cascade="all, delete-orphan")

class FertilizerBrand(enum.Enum):
    NPK_15_15_15 = "NPK 15-15-15"
    NPK_12_12_17 = "NPK 12-12-17"
    ORGANIC = "Organic"
    NONE = "None"

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.farm_id"), nullable=False)
    log_date = Column(DateTime, default=func.now(), nullable=False)
    fertilizer_type = Column(String(50), nullable=False)
    fertilizer_amount = Column(Float, nullable=False) # DOUBLE maps to Float
    pest_control = Column(String(150), nullable=True) # Null = Ya (Nullable)
    temperature = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    soil_ph = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True) # Null = Ya
    # Link back to the Farm
    farm = relationship("Farm", back_populates="logs")

class LibraryContent(Base):
    __tablename__ = "library_contents"

    content_id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.user_id"), nullable=False) # Links to Admin
    title = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False) # e.g., 'PDF', 'Video', 'Article'
    category = Column(String(80), nullable=False)
    description = Column(Text, nullable=True) # "ya" for null
    media_url = Column(String(500), nullable=True) # "ya" for null
    date_published = Column(DateTime, default=datetime.utcnow, nullable=False)
    published_by = Column(String(150), nullable=False)

    admin = relationship("Admin", back_populates="uploaded_contents")
    # 1-to-Many Relationship: One content has many interactions
    interactions = relationship("ContentInteraction", back_populates="content", cascade="all, delete")


class ContentInteraction(Base):
    __tablename__ = "content_interactions"

    interaction_id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("library_contents.content_id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.user_id"), nullable=False)
    interaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    interaction_type = Column(String(50), nullable=False) # e.g., 'Viewed', 'Downloaded'

    # Relationship back to the content
    content = relationship("LibraryContent", back_populates="interactions")


class ForumPost(Base):
    __tablename__ = "forum_posts"

    post_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    tag = Column(String(80), default="General", nullable=False)
    image_url = Column(String(500), nullable=True)
    status = Column(String(50), default="Active", nullable=False)  # Active, Locked, Deleted
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")
    replies = relationship("ForumReply", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("ForumReaction", back_populates="post", cascade="all, delete-orphan")


class ForumReply(Base):
    __tablename__ = "forum_replies"

    reply_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.post_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    reply_content = Column(Text, nullable=False)
    replied_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post = relationship("ForumPost", back_populates="replies")
    user = relationship("User")


class ForumReaction(Base):
    __tablename__ = "forum_reactions"

    reaction_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.post_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    reaction_type = Column(String(50), default="Like", nullable=False)  # e.g., Like
    reacted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post = relationship("ForumPost", back_populates="reactions")
    user = relationship("User")