import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from .database import get_session
from .models import User, Workspace, Project, Content

SECRET_KEY = os.getenv("JWT_SECRET", "omnispace-enterprise-super-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            return None
    except (JWTError, ValueError):
        return None

    user = session.get(User, user_id)
    return user if user and user.is_active else None

def get_current_user(
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

# ==========================================
# Ownership & Authorization Verification
# ==========================================

def verify_workspace_access(workspace: Workspace, user: Optional[User], require_write: bool = False) -> None:
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if require_write:
        if not user or workspace.owner_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this workspace")
    else:
        if not workspace.is_public and (not user or workspace.owner_id != user.id):
            raise HTTPException(status_code=403, detail="Forbidden: This workspace is private")

def verify_project_access(project: Project, user: Optional[User], session: Session, require_write: bool = False) -> None:
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    workspace = session.get(Workspace, project.workspace_id)
    verify_workspace_access(workspace, user, require_write)

def verify_content_access(content: Content, user: Optional[User], session: Session, require_write: bool = False) -> None:
    if not content:
        raise HTTPException(status_code=404, detail="Content item not found")
    # If it's published and read-only, anyone can view it
    if not require_write and content.is_published:
        return
    project = session.get(Project, content.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Parent project not found")
    verify_project_access(project, user, session, require_write)
