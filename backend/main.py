from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, security

from database import engine
from dependencies.db import get_db

from routers import farms
from routers import auth
from routers import users
from routers import logs
from routers import library
from routers import forum
from routers import yield_prediction
from routers import weather

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Durian Farm Management System")

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allow_headers=["Content-Type", "Authorization"],
)

# Routers
app.include_router(farms.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(logs.router)
app.include_router(library.router)
app.include_router(forum.router)
app.include_router(yield_prediction.router)
app.include_router(weather.router)



# Root endpoint
@app.get("/")
def root():
    return {"message": "Durian Farm API is officially online!"}