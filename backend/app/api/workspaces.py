import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Workspace, WorkspaceCreate, WorkspaceUpdate, User
from ..auth import get_current_user, get_current_user_optional, verify_workspace_access

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[Workspace])
def list_workspaces(
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    if current_user:
        query = select(Workspace).where(
            (Workspace.owner_id == current_user.id) | (Workspace.is_public == True)
        )
    else:
        query = select(Workspace).where(Workspace.is_public == True)
    return session.exec(query).all()

@router.post("", response_model=Workspace, status_code=status.HTTP_201_CREATED)
def create_workspace(
    payload: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    base_slug = re.sub(r'[^a-zA-Z0-9]+', '-', payload.title.lower()).strip('-') or "workspace"
    slug = f"{base_slug}-{int(datetime.utcnow().timestamp())}"

    workspace = Workspace(
        title=payload.title,
        slug=slug,
        description=payload.description,
        is_public=payload.is_public,
        owner_id=current_user.id
    )
    session.add(workspace)
    session.commit()
    session.refresh(workspace)
    return workspace

@router.get("/{workspace_id}", response_model=Workspace)
def get_workspace(
    workspace_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    workspace = session.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    verify_workspace_access(workspace, current_user, require_write=False)
    return workspace

@router.patch("/{workspace_id}", response_model=Workspace)
def update_workspace(
    workspace_id: int,
    payload: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    workspace = session.get(Workspace, workspace_id)
    verify_workspace_access(workspace, current_user, require_write=True)

    if payload.title is not None:
        workspace.title = payload.title
    if payload.description is not None:
        workspace.description = payload.description
    if payload.is_public is not None:
        workspace.is_public = payload.is_public
    workspace.updated_at = datetime.utcnow()

    session.add(workspace)
    session.commit()
    session.refresh(workspace)
    return workspace

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    workspace = session.get(Workspace, workspace_id)
    verify_workspace_access(workspace, current_user, require_write=True)
    session.delete(workspace)
    session.commit()
    return None
