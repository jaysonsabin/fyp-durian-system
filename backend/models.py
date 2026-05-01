import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Enum as SqlEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base # Import the Base we just created

# Define Enums for data integrity
class UserRole(str, enum.Enum):
    PENTADBIR = "Pentadbir"
    PENGUSAHA = "Pengusaha"

class User(Base):
    __tablename__ = "users"
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

class Farm(Base):
    __tablename__ = "farms"
    farm_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.user_id"), nullable=False)
    farm_name = Column(String(120), nullable=False)
    farm_location = Column(String(255), nullable=False)
    owner = relationship("Farmer", back_populates="farms")
    logs = relationship("ActivityLog", back_populates="farm")

class FertilizerBrand(enum.Enum):
    NPK_15_15_15 = "NPK 15-15-15"
    NPK_12_12_17 = "NPK 12-12-17"
    ORGANIC = "Organic"
    NONE = "None"

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.farm_id"), nullable=False)
    
    # Matching Jadual 3.21 exactly
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