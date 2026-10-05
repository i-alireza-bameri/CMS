import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Project, ProjectCreate, ProjectUpdate, Workspace, User
from ..auth import get_current_user, get_current_user_optional, verify_workspace_access, verify_project_access

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[Project])
def list_projects(
    workspace_id: Optional[int] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    query = select(Project)
    if workspace_id:
        workspace = session.get(Workspace, workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        verify_workspace_access(workspace, current_user, require_write=False)
        query = query.where(Project.workspace_id == workspace_id)
    return session.exec(query).all()

@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    workspace = session.get(Workspace, payload.workspace_id)
    verify_workspace_access(workspace, current_user, require_write=True)

    base_slug = re.sub(r'[^a-zA-Z0-9]+', '-', payload.title.lower()).strip('-') or "project"
    slug = f"{base_slug}-{int(datetime.utcnow().timestamp())}"

    project = Project(
        workspace_id=payload.workspace_id,
        title=payload.title,
        slug=slug,
        description=payload.description,
        is_published=payload.is_published,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@router.get("/{project_id}", response_model=Project)
def get_project(
    project_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    project = session.get(Project, project_id)
    verify_project_access(project, current_user, session, require_write=False)
    return project

@router.patch("/{project_id}", response_model=Project)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    project = session.get(Project, project_id)
    verify_project_access(project, current_user, session, require_write=True)

    if payload.title is not None:
        project.title = payload.title
    if payload.description is not None:
        project.description = payload.description
    if payload.is_published is not None:
        project.is_published = payload.is_published
    project.updated_at = datetime.utcnow()

    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    project = session.get(Project, project_id)
    verify_project_access(project, current_user, session, require_write=True)
    session.delete(project)
    session.commit()
    return None
