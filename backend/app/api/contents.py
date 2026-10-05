import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Content, ContentCreate, ContentUpdate, Project, Workspace, User
from ..auth import get_current_user, get_current_user_optional, verify_project_access, verify_content_access

router = APIRouter(prefix="/contents", tags=["Contents"])

@router.get("", response_model=List[Content])
def list_contents(
    project_id: Optional[int] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    query = select(Content)
    if project_id:
        project = session.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        verify_project_access(project, current_user, session, require_write=False)
        query = query.where(Content.project_id == project_id)
    return session.exec(query).all()

@router.post("", response_model=Content, status_code=status.HTTP_201_CREATED)
def create_content(
    payload: ContentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    project = session.get(Project, payload.project_id)
    verify_project_access(project, current_user, session, require_write=True)

    slug = payload.slug
    if not slug:
        base_slug = re.sub(r'[^a-zA-Z0-9]+', '-', payload.title.lower()).strip('-') or "doc"
        slug = f"{base_slug}-{int(datetime.utcnow().timestamp())}"

    content = Content(
        project_id=payload.project_id,
        title=payload.title,
        slug=slug,
        content_type=payload.content_type,
        text_content=payload.text_content or "",
        file_url=payload.file_url,
        file_name=payload.file_name,
        file_size=payload.file_size or 0,
        mime_type=payload.mime_type,
        is_published=payload.is_published,
    )
    session.add(content)
    session.commit()
    session.refresh(content)
    return content

@router.get("/{content_id}", response_model=Content)
def get_content(
    content_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    content = session.get(Content, content_id)
    verify_content_access(content, current_user, session, require_write=False)
    return content

@router.patch("/{content_id}", response_model=Content)
def update_content(
    content_id: int,
    payload: ContentUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    content = session.get(Content, content_id)
    verify_content_access(content, current_user, session, require_write=True)

    if payload.title is not None:
        content.title = payload.title
    if payload.slug is not None:
        content.slug = payload.slug
    if payload.content_type is not None:
        content.content_type = payload.content_type
    if payload.text_content is not None:
        content.text_content = payload.text_content
    if payload.is_published is not None:
        content.is_published = payload.is_published
    content.updated_at = datetime.utcnow()

    session.add(content)
    session.commit()
    session.refresh(content)
    return content

@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    content = session.get(Content, content_id)
    verify_content_access(content, current_user, session, require_write=True)
    session.delete(content)
    session.commit()
    return None

@router.post("/{content_id}/publish", response_model=Content)
def toggle_publish(
    content_id: int,
    is_published: bool,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    content = session.get(Content, content_id)
    verify_content_access(content, current_user, session, require_write=True)
    content.is_published = is_published
    content.updated_at = datetime.utcnow()
    session.add(content)
    session.commit()
    session.refresh(content)
    return content
