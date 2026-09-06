from pathlib import Path
import sqlite3

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


DATABASE_URL = settings.database_url

# Resolve the default SQLite database to the backend directory rather than
# depending on the current working directory.
if DATABASE_URL == "sqlite:///./youth_platform.db":
    DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[2] / "youth_platform.db"
    DATABASE_URL = f"sqlite:///{DEFAULT_DATABASE_PATH}"


connect_args: dict[str, object] = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args.update(
        {
            "check_same_thread": False,
            "timeout": 30,
            "isolation_level": None,
        }
    )


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)


if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _sqlite_configure_connection(
        dbapi_connection: sqlite3.Connection,
        connection_record,
    ):
        cursor = dbapi_connection.cursor()

        # Wait up to 30 seconds when another connection temporarily owns
        # SQLite's write lock.
        cursor.execute("PRAGMA busy_timeout = 30000")

        # WAL allows readers to continue while a writer is active and is
        # generally much better for a FastAPI development server using SQLite.
        cursor.execute("PRAGMA journal_mode = WAL")

        # Normal is a good development balance between durability and speed.
        cursor.execute("PRAGMA synchronous = NORMAL")

        cursor.close()


    @event.listens_for(engine, "begin")
    def _sqlite_explicit_begin(connection):
        # Because pysqlite implicit transaction handling is disabled above,
        # explicitly begin the SQL transaction.
        connection.exec_driver_sql("BEGIN")


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
