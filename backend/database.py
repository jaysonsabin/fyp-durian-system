from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. The Connection String
SQLALCHEMY_DATABASE_URL = "postgresql+psycopg://postgres:dp90tt003500@localhost:5432/durian_db"

# 2. The Engine: The actual connection to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. The Session: This is what you'll use to talk to the DB (Save/Delete/Query)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. The Base: Every model class (User, Farm, etc.) will inherit from this
Base = declarative_base()
