from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.db.base import Base
import app.db.models  # noqa: F401


config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


# Tables intentionally maintained outside SQLAlchemy's declarative metadata.
#
# recognition_tokens is currently accessed by app/routers/recognition.py using
# raw SQL, so Alembic must not interpret its absence from Base.metadata as a
# request to DROP the table.
#
# transaction_debug_test is a local/debug table and is likewise excluded from
# Alembic's schema comparison.
LEGACY_ALEMBIC_TABLES = {
    "recognition_tokens",
    "transaction_debug_test",
}


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and reflected and name in LEGACY_ALEMBIC_TABLES:
        return False

    # The idempotency index is intentionally database-managed.
    # It is a unique partial index and is not represented in SQLAlchemy
    # declarative metadata, so Alembic must not try to remove it.
    if (
        type_ == "index"
        and reflected
        and name == "ux_xp_transactions_idempotency_key"
    ):
        return False

    return True


def compare_type(context, inspected_column, metadata_column, inspected_type, metadata_type):
    """
    SQLite stores SQLAlchemy Enum(native_enum=False) values as VARCHAR.

    The application intentionally models these values as Python enums, but
    that should not produce a migration every time Alembic compares the
    SQLite VARCHAR representation with the SQLAlchemy Enum representation.
    """
    if (
        inspected_column.name == "game_type"
        and inspected_column.table.name == "reward_games"
    ):
        return False

    if (
        inspected_column.name == "status"
        and inspected_column.table.name == "player_reward_games"
    ):
        return False

    return None


def run_migrations_offline() -> None:
    """Run migrations without a database connection."""

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named",
        },
        compare_type=compare_type,
        compare_server_default=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations using a live database connection."""

    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {},
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=compare_type,
            compare_server_default=True,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
