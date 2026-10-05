import strawberry
from typing import Optional, List
from datetime import datetime
from strawberry.types import Info
from sqlmodel import Session, select

from .database import engine
from .models import (
    User as UserModel,
    Workspace as WorkspaceModel,
    Project as ProjectModel,
    Content as ContentModel,
)
from .auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)
from jose import jwt

# ==========================================
# Strawberry GraphQL Types
# ==========================================

@strawberry.type
class UserType:
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime

    @strawberry.field
    def workspaces(self, info: Info) -> List["WorkspaceType"]:
        with Session(engine) as session:
            db_workspaces = session.exec(
                select(WorkspaceModel).where(WorkspaceModel.owner_id == self.id)
            ).all()
            return [WorkspaceType.from_model(w) for w in db_workspaces]


@strawberry.type
class ContentType:
    id: int
    project_id: int
    title: str
    slug: str
    content_type: str
    text_content: Optional[str]
    file_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    is_published: bool
    view_count: int
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, model: ContentModel) -> "ContentType":
        return cls(
            id=model.id,
            project_id=model.project_id,
            title=model.title,
            slug=model.slug,
            content_type=model.content_type,
            text_content=model.text_content,
            file_url=model.file_url,
            file_name=model.file_name,
            file_size=model.file_size,
            mime_type=model.mime_type,
            is_published=model.is_published,
            view_count=model.view_count,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


@strawberry.type
class ProjectType:
    id: int
    workspace_id: int
    title: str
    slug: str
    description: str
    is_published: bool
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def contents(self, info: Info) -> List[ContentType]:
        with Session(engine) as session:
            db_contents = session.exec(
                select(ContentModel).where(ContentModel.project_id == self.id)
            ).all()
            return [ContentType.from_model(c) for c in db_contents]

    @classmethod
    def from_model(cls, model: ProjectModel) -> "ProjectType":
        return cls(
            id=model.id,
            workspace_id=model.workspace_id,
            title=model.title,
            slug=model.slug,
            description=model.description,
            is_published=model.is_published,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


@strawberry.type
class WorkspaceType:
    id: int
    title: str
    slug: str
    description: str
    is_public: bool
    owner_id: int
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def projects(self, info: Info) -> List[ProjectType]:
        with Session(engine) as session:
            db_projects = session.exec(
                select(ProjectModel).where(ProjectModel.workspace_id == self.id)
            ).all()
            return [ProjectType.from_model(p) for p in db_projects]

    @classmethod
    def from_model(cls, model: WorkspaceModel) -> "WorkspaceType":
        return cls(
            id=model.id,
            title=model.title,
            slug=model.slug,
            description=model.description,
            is_public=model.is_public,
            owner_id=model.owner_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


@strawberry.type
class AuthPayload:
    access_token: str
    token_type: str
    user: UserType


# Helper to get auth user from strawberry context
def get_user_from_info(info: Info) -> Optional[UserModel]:
    request = info.context.get("request")
    if not request:
        return None
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        with Session(engine) as session:
            return session.get(UserModel, user_id)
    except Exception:
        return None


# ==========================================
# Queries
# ==========================================

@strawberry.type
class Query:
    @strawberry.field
    def me(self, info: Info) -> Optional[UserType]:
        user = get_user_from_info(info)
        if not user:
            return None
        return UserType(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at,
        )

    @strawberry.field
    def workspaces(self, info: Info) -> List[WorkspaceType]:
        user = get_user_from_info(info)
        with Session(engine) as session:
            if user:
                # User's own workspaces + public workspaces
                workspaces = session.exec(
                    select(WorkspaceModel).where(
                        (WorkspaceModel.owner_id == user.id) | (WorkspaceModel.is_public == True)
                    )
                ).all()
            else:
                workspaces = session.exec(
                    select(WorkspaceModel).where(WorkspaceModel.is_public == True)
                ).all()
            return [WorkspaceType.from_model(w) for w in workspaces]

    @strawberry.field
    def workspace(self, info: Info, id: int) -> Optional[WorkspaceType]:
        user = get_user_from_info(info)
        with Session(engine) as session:
            workspace = session.get(WorkspaceModel, id)
            if not workspace:
                return None
            if not workspace.is_public and (not user or workspace.owner_id != user.id):
                raise Exception("Unauthorized: Private workspace")
            return WorkspaceType.from_model(workspace)

    @strawberry.field
    def project(self, info: Info, id: int) -> Optional[ProjectType]:
        user = get_user_from_info(info)
        with Session(engine) as session:
            project = session.get(ProjectModel, id)
            if not project:
                return None
            workspace = session.get(WorkspaceModel, project.workspace_id)
            if not workspace.is_public and (not user or workspace.owner_id != user.id):
                raise Exception("Unauthorized: Private project")
            return ProjectType.from_model(project)

    @strawberry.field
    def content(self, info: Info, id: int) -> Optional[ContentType]:
        user = get_user_from_info(info)
        with Session(engine) as session:
            content = session.get(ContentModel, id)
            if not content:
                return None
            if not content.is_published:
                project = session.get(ProjectModel, content.project_id)
                workspace = session.get(WorkspaceModel, project.workspace_id)
                if not user or workspace.owner_id != user.id:
                    raise Exception("Unauthorized: Content is private")
            return ContentType.from_model(content)

    @strawberry.field
    def public_content(self, slug: str) -> Optional[ContentType]:
        """Fetch publicly published content by slug (/d/:slug) - No authentication required."""
        with Session(engine) as session:
            content = session.exec(
                select(ContentModel).where(
                    ContentModel.slug == slug,
                    ContentModel.is_published == True
                )
            ).first()
            if not content:
                return None
            # Increment view count
            content.view_count += 1
            session.add(content)
            session.commit()
            session.refresh(content)
            return ContentType.from_model(content)

    @strawberry.field
    def public_projects(self) -> List[ProjectType]:
        """Fetch all publicly published projects for landing page explore showcase."""
        with Session(engine) as session:
            projects = session.exec(
                select(ProjectModel).where(ProjectModel.is_published == True)
            ).all()
            return [ProjectType.from_model(p) for p in projects]


# ==========================================
# Mutations
# ==========================================

@strawberry.type
class Mutation:
    @strawberry.mutation
    def register(self, email: str, password: str, full_name: str = "") -> AuthPayload:
        with Session(engine) as session:
            existing = session.exec(select(UserModel).where(UserModel.email == email)).first()
            if existing:
                raise Exception("Email already registered")
            new_user = UserModel(
                email=email,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role="owner"
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)

            token = create_access_token({"sub": str(new_user.id)})
            return AuthPayload(
                access_token=token,
                token_type="bearer",
                user=UserType(
                    id=new_user.id,
                    email=new_user.email,
                    full_name=new_user.full_name,
                    role=new_user.role,
                    created_at=new_user.created_at,
                )
            )

    @strawberry.mutation
    def login(self, email: str, password: str) -> AuthPayload:
        with Session(engine) as session:
            user = session.exec(select(UserModel).where(UserModel.email == email)).first()
            if not user or not verify_password(password, user.hashed_password):
                raise Exception("Invalid email or password")

            token = create_access_token({"sub": str(user.id)})
            return AuthPayload(
                access_token=token,
                token_type="bearer",
                user=UserType(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    role=user.role,
                    created_at=user.created_at,
                )
            )

    @strawberry.mutation
    def create_workspace(self, info: Info, title: str, description: str = "", is_public: bool = False) -> WorkspaceType:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")

        import re
        slug_base = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-') or "workspace"
        slug = f"{slug_base}-{int(datetime.utcnow().timestamp())}"

        with Session(engine) as session:
            ws = WorkspaceModel(
                title=title,
                slug=slug,
                description=description,
                is_public=is_public,
                owner_id=user.id
            )
            session.add(ws)
            session.commit()
            session.refresh(ws)
            return WorkspaceType.from_model(ws)

    @strawberry.mutation
    def update_workspace(self, info: Info, id: int, title: Optional[str] = None, description: Optional[str] = None, is_public: Optional[bool] = None) -> WorkspaceType:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            ws = session.get(WorkspaceModel, id)
            if not ws or ws.owner_id != user.id:
                raise Exception("Workspace not found or unauthorized")
            if title is not None:
                ws.title = title
            if description is not None:
                ws.description = description
            if is_public is not None:
                ws.is_public = is_public
            ws.updated_at = datetime.utcnow()
            session.add(ws)
            session.commit()
            session.refresh(ws)
            return WorkspaceType.from_model(ws)

    @strawberry.mutation
    def delete_workspace(self, info: Info, id: int) -> bool:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            ws = session.get(WorkspaceModel, id)
            if not ws or ws.owner_id != user.id:
                raise Exception("Workspace not found or unauthorized")
            session.delete(ws)
            session.commit()
            return True

    @strawberry.mutation
    def create_project(self, info: Info, workspace_id: int, title: str, description: str = "", is_published: bool = False) -> ProjectType:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            ws = session.get(WorkspaceModel, workspace_id)
            if not ws or ws.owner_id != user.id:
                raise Exception("Workspace not found or unauthorized")
            
            import re
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-') or "project"
            proj = ProjectModel(
                workspace_id=workspace_id,
                title=title,
                slug=f"{slug}-{int(datetime.utcnow().timestamp())}",
                description=description,
                is_published=is_published,
            )
            session.add(proj)
            session.commit()
            session.refresh(proj)
            return ProjectType.from_model(proj)

    @strawberry.mutation
    def create_content(
        self,
        info: Info,
        project_id: int,
        title: str,
        content_type: str,
        slug: Optional[str] = None,
        text_content: Optional[str] = "",
        file_url: Optional[str] = None,
        file_name: Optional[str] = None,
        file_size: Optional[int] = 0,
        mime_type: Optional[str] = None,
        is_published: bool = False
    ) -> ContentType:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            proj = session.get(ProjectModel, project_id)
            if not proj:
                raise Exception("Project not found")
            ws = session.get(WorkspaceModel, proj.workspace_id)
            if not ws or ws.owner_id != user.id:
                raise Exception("Unauthorized: You do not own this project")

            import re
            if not slug:
                base_slug = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-') or "doc"
                slug = f"{base_slug}-{int(datetime.utcnow().timestamp())}"

            cnt = ContentModel(
                project_id=project_id,
                title=title,
                slug=slug,
                content_type=content_type,
                text_content=text_content or "",
                file_url=file_url,
                file_name=file_name,
                file_size=file_size or 0,
                mime_type=mime_type,
                is_published=is_published,
            )
            session.add(cnt)
            session.commit()
            session.refresh(cnt)
            return ContentType.from_model(cnt)

    @strawberry.mutation
    def publish_content(self, info: Info, id: int, is_published: bool) -> ContentType:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            cnt = session.get(ContentModel, id)
            if not cnt:
                raise Exception("Content not found")
            proj = session.get(ProjectModel, cnt.project_id)
            ws = session.get(WorkspaceModel, proj.workspace_id)
            if not ws or ws.owner_id != user.id:
                raise Exception("Unauthorized to publish this content")
            cnt.is_published = is_published
            cnt.updated_at = datetime.utcnow()
            session.add(cnt)
            session.commit()
            session.refresh(cnt)
            return ContentType.from_model(cnt)

schema = strawberry.Schema(query=Query, mutation=Mutation)
