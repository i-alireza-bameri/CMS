import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from ..database import get_session
from ..models import Content, Project, Workspace, User
from ..auth import get_current_user, get_current_user_optional, verify_content_access

router = APIRouter(prefix="/files", tags=["Files"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Helper for content type detection based on extension
def detect_content_type(filename: str, mime_type: str = "") -> str:
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    if ext in ["md", "markdown"]:
        return "markdown"
    elif ext in ["py", "ts", "tsx", "js", "jsx", "html", "css", "json", "sql", "sh", "yaml", "yml", "rust", "go"]:
        return "code"
    elif ext in ["txt", "log", "env", "csv"]:
        return "text"
    elif ext in ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"]:
        return "image"
    elif ext in ["pdf"]:
        return "pdf"
    elif ext in ["mp4", "webm", "ogg", "mov"]:
        return "video"
    elif ext in ["xlsx", "xls"]:
        return "excel"
    elif ext in ["docx", "doc"]:
        return "word"
    return "file"

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: int = Form(...),
    title: Optional[str] = Form(None),
    is_published: bool = Form(False),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Target project not found")
    workspace = session.get(Workspace, project.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to upload to this project")

    original_filename = file.filename or "uploaded_file"
    ext = Path(original_filename).suffix
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = UPLOAD_DIR / unique_filename

    # Save to disk
    with dest_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = dest_path.stat().st_size
    detected_type = detect_content_type(original_filename, file.content_type or "")
    item_title = title or original_filename

    # Generate slug
    import re
    clean_name = re.sub(r'[^a-zA-Z0-9]+', '-', item_title.lower()).strip('-') or "file"
    slug = f"{clean_name}-{uuid.uuid4().hex[:8]}"

    # If it's a text-based file, read preview snippet
    text_snippet = ""
    if detected_type in ["markdown", "code", "text"]:
        try:
            with open(dest_path, "r", encoding="utf-8", errors="ignore") as f:
                text_snippet = f.read()
        except Exception:
            pass

    content = Content(
        project_id=project_id,
        title=item_title,
        slug=slug,
        content_type=detected_type,
        text_content=text_snippet,
        file_url=f"/uploads/{unique_filename}",
        file_name=original_filename,
        file_size=file_size,
        mime_type=file.content_type,
        is_published=is_published,
    )
    session.add(content)
    session.commit()
    session.refresh(content)

    return {
        "message": "File uploaded successfully",
        "content": content,
    }

@router.get("/download/{content_id}")
def download_file(
    content_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    content = session.get(Content, content_id)
    if not content or not content.file_url:
        raise HTTPException(status_code=404, detail="File content not found")

    verify_content_access(content, current_user, session, require_write=False)

    filename = Path(content.file_url).name
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Stored file does not exist on disk")

    return FileResponse(
        path=file_path,
        filename=content.file_name or filename,
        media_type=content.mime_type or "application/octet-stream"
    )
