from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def column_exists(
    engine: Engine,
    table_name: str,
    column_name: str,
) -> bool:
    inspector = inspect(engine)

    if not inspector.has_table(table_name):
        return False

    columns = inspector.get_columns(table_name)

    return any(
        column["name"] == column_name
        for column in columns
    )


def add_xp_transaction_group_id(engine: Engine) -> None:
    """
    Adds XPTransaction.group_id to existing pilot databases.

    Safe to run repeatedly.
    """

    if column_exists(
        engine,
        "xp_transactions",
        "group_id",
    ):
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                ALTER TABLE xp_transactions
                ADD COLUMN group_id INTEGER
                """
            )
        )

        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS
                ix_xp_transactions_group_id
                ON xp_transactions (group_id)
                """
            )
        )


def run_migrations(engine: Engine) -> None:
    add_xp_transaction_group_id(engine)
