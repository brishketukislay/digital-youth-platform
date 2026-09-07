"""add programme to players

Revision ID: add_player_programme
Revises: REPLACE_WITH_PREVIOUS_REVISION
Create Date: 2026-09-07
"""

from alembic import op
import sqlalchemy as sa


revision = "add_player_programme"
down_revision = "REPLACE_WITH_PREVIOUS_REVISION"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add nullable initially so existing players can be backfilled.
    op.add_column(
        "players",
        sa.Column(
            "programme_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_players_programme_id",
        "players",
        ["programme_id"],
    )

    op.create_foreign_key(
        "fk_players_programme_id_programmes",
        "players",
        "programmes",
        ["programme_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Existing players inherit their programme from their current group.
    op.execute(
        """
        UPDATE players
        SET programme_id = groups.programme_id
        FROM groups
        WHERE players.group_id = groups.id
          AND players.programme_id IS NULL
        """
    )

    # Any player without a group needs an explicit programme.
    # Do NOT silently assign one here.
    remaining = op.get_bind().execute(
        sa.text(
            "SELECT COUNT(*) FROM players WHERE programme_id IS NULL"
        )
    ).scalar_one()

    if remaining:
        raise RuntimeError(
            f"{remaining} player(s) still have no programme_id. "
            "Assign their programmes before rerunning the migration."
        )

    op.alter_column(
        "players",
        "programme_id",
        existing_type=sa.Integer(),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_players_programme_id_programmes",
        "players",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_players_programme_id",
        table_name="players",
    )

    op.drop_column(
        "players",
        "programme_id",
    )
