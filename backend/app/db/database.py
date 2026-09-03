from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


settings = get_settings()


def _create_engine():
    """
    Create the SQLAlchemy engine.

    SQLite is retained for local development.

    Production should use PostgreSQL, for example:

        postgresql+psycopg://user:password@host/database

    The architecture deliberately keeps the rest of the application
    database-agnostic.
    """

    database_url = settings.database_url

    connect_args: dict[str, object] = {}

    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    return create_engine(
        database_url,
        echo=settings.database_echo,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


engine = _create_engine()


SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides one database session per request.

    The session is always closed when the request finishes.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> None:
    """
    Perform a lightweight database connectivity check.

    Used by application startup/health checks.

    Raises:
        sqlalchemy.exc.SQLAlchemyError:
            If the database cannot be reached.
    """

    from sqlalchemy import text

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def dispose_database_engine() -> None:
    """
    Dispose the SQLAlchemy connection pool.

    Primarily useful during application shutdown and tests.
    """

    engine.dispose()
