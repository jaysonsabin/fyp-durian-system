from database import engine, Base
import models # This line is critical; it tells SQLAlchemy to load your classes

def create_tables():
    print("Connecting to PostgreSQL and creating tables...")
    # This command reads your models.py and creates them in Postgres
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    create_tables()