from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import (
    XPTransaction,
    Player,
    Group,
    Programme,
)


def player_xp(
    db: Session,
    player_id: int,
) -> int:

    result = db.query(
        func.coalesce(
            func.sum(XPTransaction.amount),
            0,
        )
    ).filter(
        XPTransaction.player_id == player_id
    ).scalar()

    return int(result or 0)


def group_xp(
    db: Session,
    programme_id: int | None = None,
) -> int:

    query = (
        db.query(
            func.coalesce(
                func.sum(XPTransaction.group_amount),
                0,
            )
        )
        .join(
            Player,
            Player.id == XPTransaction.player_id,
        )
        .join(
            Group,
            Group.id == Player.group_id,
        )
    )

    if programme_id is not None:
        query = query.filter(
            Group.programme_id == programme_id
        )

    result = query.scalar()

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