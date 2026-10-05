import os
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from strawberry.fastapi import GraphQLRouter

from .database import init_db, get_session
from .schema import schema
from .models import Content, Project
from .api import auth, workspaces, projects, contents, files

# Initialize FastAPI application
app = FastAPI(
    title="OmniSpace API",
    description="Full-stack Workspaces, Projects, and Content Management API powered by FastAPI, SQLModel, and Strawberry GraphQL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Strawberry GraphQL Router
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql", tags=["Strawberry GraphQL"])

# REST Routers
app.include_router(auth.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(contents.router, prefix="/api")
app.include_router(files.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "OmniSpace Backend", "version": "1.0.0"}

# Public Content by Slug (/d/:slug) - No authentication required
@app.get("/api/public/content/{slug}", tags=["Public"])
def get_public_content(slug: str, session: Session = Depends(get_session)):
    content = session.exec(
        select(Content).where(Content.slug == slug, Content.is_published == True)
    ).first()
    if not content:
        raise HTTPException(status_code=404, detail="Public content not found or unpublished")

    content.view_count += 1
    session.add(content)
    session.commit()
    session.refresh(content)
    return content

# Public projects for showcase
@app.get("/api/public/showcase", tags=["Public"])
def get_public_showcase(session: Session = Depends(get_session)):
    projects = session.exec(
        select(Project).where(Project.is_published == True)
    ).all()
    return projects

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
