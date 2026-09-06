"""add recognition tokens table

Revision ID: 91976f39c3ff
Revises: 0c50ed9e34bb
Create Date: 2026-09-06 21:33:17.834414

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "91976f39c3ff"
down_revision: Union[str, Sequence[str], None] = "0c50ed9e34bb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recognition_tokens",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column(
            "player_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "token_hash",
            sa.String(length=64),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.Column(
            "active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.ForeignKeyConstraint(
            ["player_id"],
            ["players.id"],
        ),
    )

    op.create_index(
        "ix_recognition_tokens_player_id",
        "recognition_tokens",
        ["player_id"],
        unique=False,
    )

    op.create_index(
        "ix_recognition_tokens_token_hash",
        "recognition_tokens",
        ["token_hash"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_recognition_tokens_token_hash",
        table_name="recognition_tokens",
    )

    op.drop_index(
        "ix_recognition_tokens_player_id",
        table_name="recognition_tokens",
    )

    op.drop_table("recognition_tokens")