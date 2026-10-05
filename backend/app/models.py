from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship

class ContentTypeEnum(str, Enum):
    MARKDOWN = "markdown"
    CODE = "code"
    TEXT = "text"
    IMAGE = "image"
    PDF = "pdf"
    VIDEO = "video"
    EXCEL = "excel"
    WORD = "word"
    FILE = "file"

# ==========================================
# Database Table Models
# ==========================================

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    full_name: str = Field(default="")
    role: str = Field(default="member")  # owner, admin, member
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspaces: List["Workspace"] = Relationship(back_populates="owner", cascade_delete=True)


class Workspace(SQLModel, table=True):
    __tablename__ = "workspaces"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, nullable=False)
    slug: str = Field(index=True, unique=True, nullable=False)
    description: str = Field(default="")
    is_public: bool = Field(default=False)
    owner_id: int = Field(foreign_key="users.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    owner: Optional[User] = Relationship(back_populates="workspaces")
    projects: List["Project"] = Relationship(back_populates="workspace", cascade_delete=True)


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id", nullable=False)
    title: str = Field(index=True, nullable=False)
    slug: str = Field(index=True, nullable=False)
    description: str = Field(default="")
    is_published: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspace: Optional[Workspace] = Relationship(back_populates="projects")
    contents: List["Content"] = Relationship(back_populates="project", cascade_delete=True)


class Content(SQLModel, table=True):
    __tablename__ = "contents"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", nullable=False)
    title: str = Field(index=True, nullable=False)
    slug: str = Field(index=True, unique=True, nullable=False)  # For /d/:slug public access
    content_type: str = Field(default="markdown")  # ContentTypeEnum values
    text_content: Optional[str] = Field(default="")
    file_url: Optional[str] = Field(default=None)
    file_name: Optional[str] = Field(default=None)
    file_size: Optional[int] = Field(default=0)  # bytes
    mime_type: Optional[str] = Field(default=None)
    is_published: bool = Field(default=False)
    view_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    project: Optional[Project] = Relationship(back_populates="contents")


# ==========================================
# Pydantic / DTO schemas for API validation
# ==========================================

class UserCreate(SQLModel):
    email: str
    password: str
    full_name: str = ""

class UserLogin(SQLModel):
    email: str
    password: str

class UserRead(SQLModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime

class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

class WorkspaceCreate(SQLModel):
    title: str
    description: str = ""
    is_public: bool = False

class WorkspaceUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class ProjectCreate(SQLModel):
    workspace_id: int
    title: str
    description: str = ""
    is_published: bool = False

class ProjectUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_published: Optional[bool] = None

class ContentCreate(SQLModel):
    project_id: int
    title: str
    slug: Optional[str] = None
    content_type: str = "markdown"
    text_content: Optional[str] = ""
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = 0
    mime_type: Optional[str] = None
    is_published: bool = False

class ContentUpdate(SQLModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content_type: Optional[str] = None
    text_content: Optional[str] = None
    is_published: Optional[bool] = None
