import os
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session

# SQLite by default, easily swapped with PostgreSQL URL:
# e.g., postgresql+psycopg2://user:password@localhost:5432/omnispace
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./omnispace.db")

# SQLite needs connect_args for multithreading in FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "False").lower() in ("true", "1"),
    connect_args=connect_args
)

def init_db() -> None:
    """Create all database tables based on SQLModel metadata."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency for yielding database sessions."""
    with Session(engine) as session:
        yield session
