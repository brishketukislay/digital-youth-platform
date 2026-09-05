from __future__ import annotations

from dataclasses import dataclass

from app.models.xp_transaction import XPTransactionType


@dataclass(frozen=True)
class XPAward:
    """
    One logical XP event.

    Player and group amounts are independent because some mechanics
    award different amounts to the participant and collective pool.
    """

    programme_id: int

    transaction_type: XPTransactionType

    idempotency_key: str

    player_amount: int = 0
    group_amount: int = 0

    player_id: int | None = None
    cohort_id: int | None = None

    source_type: str | None = None
    source_id: int | None = None

    created_by_user_id: int | None = None

    reason: str | None = None

    metadata: dict | None = None


@dataclass(frozen=True)
class XPResult:
    player_transaction_id: int | None
    group_transaction_id: int | None

    player_amount: int
    group_amount: int

    player_balance: int | None
    group_balance: int | None
