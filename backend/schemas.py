from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from models import UserRole
from enum import Enum as PyEnum

# Data required to create a User
class UserCreate(BaseModel):
    full_name: str
    password: str  # The raw password from the user
    role: UserRole

# Data required to create a Farmer (inherits from User)
class FarmerCreate(UserCreate):
    address: Optional[str] = None

# Data the API will send back (Hiding the password for security!)
class UserOut(BaseModel):
    user_id: int
    full_name: str
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
    temperature: float
    rainfall: float
    soil_ph: float

    model_config = ConfigDict(from_attributes=True)