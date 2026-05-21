import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = "!DP90tt0035wot7751sp6689s8a2@#%$^&*()_+" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Tells FastAPI to look for "Authorization: Bearer <TOKEN>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# THE MISSING LINK: The security gatekeeper function
def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("sub")
        role: str = payload.get("role")
        user_type: str = payload.get("type")
        
        if user_id is None or username is None:
            raise credentials_exception
        return {"id": user_id, "username": username, "role": role, "type": user_type}
    except JWTError:
        raise credentials_exception

from typing import Optional
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme_optional)) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("sub")
        role: str = payload.get("role")
        user_type: str = payload.get("type")
        
        if user_id is None or username is None:
            return None
        return {"id": user_id, "username": username, "role": role, "type": user_type}
    except JWTError:
        return None