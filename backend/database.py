import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv


load_dotenv()  # Load environment variables from .env file

# 1. Connection String
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg://postgres:postgres@localhost:5432/durian_db"
)

# Automatically normalize protocol prefix to force modern psycopg (v3) dialect
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

# 2. The Engine: The actual connection to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. The Session: This is what you'll use to talk to the DB (Save/Delete/Query)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. The Base: Every model class (User, Farm, etc.) will inherit from this
Base = declarative_base()
