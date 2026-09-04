from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from ..core.config import settings


# ---------------------------------------------------------------------------
# Database configuration
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

DEFAULT_DATABASE_PATH = BASE_DIR / "youth_platform.db"

DATABASE_URL = settings.database_url

# If the configured URL is the default relative SQLite URL, make it absolute
# so the database location does not depend on the shell's current directory.
if DATABASE_URL == "sqlite:///./youth_platform.db":
    DATABASE_URL = f"sqlite:///{DEFAULT_DATABASE_PATH}"


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

connect_args: dict[str, object] = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    future=True,
)


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
