from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from models.task_models import UserCreate, UserResponse
from auth.utils import get_password_hash, create_access_token, verify_password
from database.config import get_session
from models.task_models import User
from pydantic import BaseModel
import requests
from core.exceptions import DuplicateEmailException, InvalidCredentialsException

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, session: Session = Depends(get_session)):
    # Check if user already exists
    existing_user = session.query(User).filter(User.email == user.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    
    access_token = create_access_token(data={"sub": str(user.id)})

    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        password_hash=hashed_password
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user

@router.post("/login")
def login(request: LoginRequest, session: Session = Depends(get_session)):
    # Find user by email
    user = session.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise InvalidCredentialsException()

    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,  # Add this
        "email": user.email,  # Add this
        "created_at": user.created_at.isoformat(),  # Add this
        "updated_at": user.updated_at.isoformat()   # Add this
    }