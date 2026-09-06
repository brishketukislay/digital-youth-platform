from __future__ import annotations

from collections.abc import Generator
from pathlib import Path
import sqlite3

from sqlalchemy import create_engine, event
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

    # Give SQLite time to wait for another transaction to finish
    # instead of immediately raising "database is locked".
    connect_args["timeout"] = 30

    # Disable pysqlite's implicit transaction handling.
    #
    # SQLAlchemy will control BEGIN / COMMIT / ROLLBACK explicitly.
    connect_args["isolation_level"] = None


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    future=True,
)


# ---------------------------------------------------------------------------
# SQLite transaction control
# ---------------------------------------------------------------------------
#
# pysqlite has historically tried to manage transactions itself. That can
# interfere with SQLAlchemy's Session transaction boundaries, particularly
# when using SQLite for application-level tests.
#
# Setting the DBAPI isolation_level to None disables that behaviour.
# SQLAlchemy then owns the transaction boundary.
#
# Every SQLAlchemy transaction gets an explicit BEGIN.
#

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _sqlite_disable_implicit_transactions(dbapi_connection, connection_record):
        # Disable pysqlite's automatic BEGIN/COMMIT behaviour.
        dbapi_connection.isolation_level = None

        # Improve SQLite behaviour when the development server has
        # several concurrent requests.
        cursor = dbapi_connection.cursor()

        try:
            cursor.execute("PRAGMA busy_timeout = 30000")
            cursor.execute("PRAGMA journal_mode = WAL")
            cursor.execute("PRAGMA synchronous = NORMAL")
        finally:
            cursor.close()

    @event.listens_for(engine, "begin")
    def _sqlite_explicit_begin(connection):
        # SQLAlchemy Session.begin()/flush()/rollback() now operate against
        # a real SQLite transaction.
        connection.exec_driver_sql("BEGIN")


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
