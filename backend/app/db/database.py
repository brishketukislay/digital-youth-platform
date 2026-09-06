from pathlib import Path
import sqlite3

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


# ---------------------------------------------------------------------------
# Database URL
# ---------------------------------------------------------------------------

DATABASE_URL = settings.database_url

# Resolve the default SQLite database relative to the backend directory.
#
# settings.database_url normally contains:
#     sqlite:///./youth_platform.db
#
# Using an absolute path prevents the database location from depending on
# whatever directory happened to launch Uvicorn.
if DATABASE_URL == "sqlite:///./youth_platform.db":
    DATABASE_PATH = Path(__file__).resolve().parents[2] / "youth_platform.db"
    DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

connect_args: dict[str, object] = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False,
        "timeout": 30,
        "isolation_level": None,
    }


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)


# ---------------------------------------------------------------------------
# SQLite configuration
# ---------------------------------------------------------------------------

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _sqlite_configure_connection(
        dbapi_connection: sqlite3.Connection,
        connection_record,
    ) -> None:
        """
        Configure every SQLite connection.

        Important:
        - WAL is deliberately not forced here.
        - The database previously experienced corruption / disk I/O errors.
        - SQLite's journal mode is therefore left alone rather than changing
          the database journal mode every time a new connection is opened.
        """

        cursor = dbapi_connection.cursor()

        try:
            # Wait for another connection's write lock instead of immediately
            # failing with "database is locked".
            cursor.execute("PRAGMA busy_timeout = 30000")

            # Foreign-key enforcement must be enabled per SQLite connection.
            cursor.execute("PRAGMA foreign_keys = ON")

            # Good durability without the extra write overhead of FULL.
            cursor.execute("PRAGMA synchronous = NORMAL")

        finally:
            cursor.close()


    @event.listens_for(engine, "begin")
    def _sqlite_explicit_begin(connection) -> None:
        """
        SQLAlchemy owns transaction boundaries.

        pysqlite implicit transaction handling is disabled via
        isolation_level=None, so explicitly start transactions here.
        """

        connection.exec_driver_sql("BEGIN")


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_db():
    """
    FastAPI database-session dependency.

    Usage:

        def endpoint(db: Session = Depends(get_db)):
            ...
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


__all__ = [
    "DATABASE_URL",
    "engine",
    "SessionLocal",
    "get_db",
]
