from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import XPTransaction, Player


def player_xp(db: Session, player_id: int) -> int:
    result = db.query(
        func.coalesce(func.sum(XPTransaction.amount), 0)
    ).filter(
        XPTransaction.player_id == player_id
    ).scalar()

    return int(result or 0)


def group_xp(db: Session) -> int:
    result = db.query(
        func.coalesce(func.sum(XPTransaction.group_amount), 0)
    ).scalar()

    return int(result or 0)


def award_xp(
    db: Session,
    player_id: int,
    amount: int,
    group_amount: int,
    transaction_type: str,
    reason: str,
    created_by: int | None = None,
):
    transaction = XPTransaction(
        player_id=player_id,
        amount=amount,
        group_amount=group_amount,
        type=transaction_type,
        reason=reason,
        created_by=created_by,
    )

    db.add(transaction)
    return transaction
