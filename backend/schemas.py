from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from models import UserRole
from enum import Enum as PyEnum

# NEW: Schema for when a user logs in
class UserLogin(BaseModel):
    username: str
    password: str

# Data required to create a User
class UserCreate(BaseModel):
    full_name: str
    username: str
    password: str = Field(..., min_length=8)
    role: UserRole

# Data required to create a Farmer (inherits from User)
class FarmerCreate(UserCreate):
    address: Optional[str] = None

# Data the API will send back (Hiding the password for security!)
class UserOut(BaseModel):
    user_id: int
    full_name: str
    username: str
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Data required to create a Farm
class FarmCreate(BaseModel):
    farm_name: str
    farm_location: str
    farmer_id: int  # The ID of the farmer who owns this

# Data the API sends back
class FarmOut(BaseModel):
    farm_id: int
    farm_name: str
    farm_location: str
    farmer_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class FertilizerEnum(str, PyEnum):
    NPK_15_15_15 = "NPK 15-15-15"
    NPK_12_12_17 = "NPK 12-12-17"
    ORGANIC = "Organic"
    NONE = "None"

class ActivityLogCreate(BaseModel):
    farm_id: int
    fertilizer_type: FertilizerEnum
    fertilizer_amount: float
    pest_control: Optional[str] = None
    activity_type: str = "Fertilization"
    temperature: float
    rainfall: float
    soil_ph: float
    remarks: Optional[str] = None

class ActivityLogOut(BaseModel):
    log_id: int
    farm_id: int
    log_date: datetime
    fertilizer_type: FertilizerEnum
    fertilizer_amount: float
    activity_type: str
    temperature: float
    rainfall: float
    soil_ph: float
    pest_control: Optional[str] = "None"
    remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class WeatherOut(BaseModel):
    temperature: float
    rainfall: float

# ==========================================
# CONTENT INTERACTION SCHEMAS
# ==========================================
class InteractionCreate(BaseModel):
    content_id: int
    farmer_id: int
    interaction_type: str # e.g., "downloaded" or "viewed"

class InteractionOut(InteractionCreate):
    interaction_id: int
    interaction_date: datetime

    class Config:
        from_attributes = True

# ==========================================
# LIBRARY CONTENT SCHEMAS
# ==========================================
class LibraryContentCreate(BaseModel):
    admin_id: Optional[int] = None
    title: str
    type: str
    category: str
    description: Optional[str] = None
    media_url: Optional[str] = None
    published_by: str

class LibraryContentOut(LibraryContentCreate):
    content_id: int
    date_published: datetime
    
    # This automatically nests the interactions when you fetch a book!
    interactions: List[InteractionOut] = []

    class Config:
        from_attributes = True
        
# Schema for handling profile update requests
class ProfileUpdate(BaseModel):
    full_name: str
    address: str

class FarmUpdate(BaseModel):
    farm_name: str
    farm_location: str

class ActivityLogUpdate(BaseModel):
    fertilizer_type: FertilizerEnum
    fertilizer_amount: float
    pest_control: Optional[str] = None
    activity_type: str = "Fertilization"
    temperature: float
    rainfall: float
    soil_ph: float
    remarks: Optional[str] = None


# ==========================================
# FORUM SCHEMAS
# ==========================================
class ForumReactionCreate(BaseModel):
    reaction_type: str = "Like"

class ForumReactionOut(BaseModel):
    reaction_id: int
    post_id: int
    user_id: int
    reaction_type: str
    reacted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ForumReplyCreate(BaseModel):
    reply_content: str

class ForumReplyUpdate(BaseModel):
    reply_content: str

class ForumReplyOut(BaseModel):
    reply_id: int
    post_id: int
    user_id: int
    reply_content: str
    replied_at: datetime
    user: UserOut

    model_config = ConfigDict(from_attributes=True)


class ForumPostCreate(BaseModel):
    title: str
    content: str
    tag: Optional[str] = "General"
    image_url: Optional[str] = None

class ForumPostUpdate(BaseModel):
    title: str
    content: str
    tag: Optional[str] = "General"
    image_url: Optional[str] = None

class ForumPostOut(BaseModel):
    post_id: int
    user_id: int
    title: str
    content: str
    tag: str
    image_url: Optional[str] = None
    status: str
    created_at: datetime
    user: UserOut
    replies: List[ForumReplyOut] = []
    reactions: List[ForumReactionOut] = []

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# YIELD PREDICTION SCHEMAS
# ==========================================
class ModelPredictionDetails(BaseModel):
    yield_predicted: float
    grade_a: float
    grade_b: float
    grade_c: float
    accuracy: float

class YieldPredictionResponse(BaseModel):
    farm_id: int
    farm_name: str
    derived_inputs: dict
    linear_regression: ModelPredictionDetails
    random_forest: ModelPredictionDetails
    recommendation: str

