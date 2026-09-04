from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db.models import (
    Player,
    YouthGroup,
    XPTransaction,
)


class XPError(Exception):
    """Base XP-domain exception."""


class InvalidXPAmountError(XPError):
    pass


class DuplicateXPTransactionError(XPError):
    pass


class PlayerNotFoundError(XPError):
    pass


class GroupNotFoundError(XPError):
    pass


@dataclass(frozen=True)
class XPBalance:
    player_id: int
    lifetime_xp: int
    current_xp: int


@dataclass(frozen=True)
class XPChange:
    player_id: int
    individual_amount: int
    group_amount: int
    transaction_id: int | None
    reference: str | None


def _validate_amount(
    amount: int,
    *,
    field_name: str,
) -> int:
    """
    XP is represented as an integer.

    Negative XP is permitted because penalties are supported.

    Zero-value transactions are rejected.
    """

    if isinstance(amount, bool):
        raise InvalidXPAmountError(
            f"{field_name} must be an integer."
        )

    try:
        value = int(amount)
    except (TypeError, ValueError) as exc:
        raise InvalidXPAmountError(
            f"{field_name} must be an integer."
        ) from exc

    if value == 0:
        raise InvalidXPAmountError(
            f"{field_name} cannot be zero."
        )

    return value


def _get_player(
    db: Session,
    player_id: int,
) -> Player:
    player = db.get(Player, player_id)

    if player is None:
        raise PlayerNotFoundError(
            f"Player {player_id} was not found."
        )

    return player


def _find_reference(
    db: Session,
    reference: str,
) -> XPTransaction | None:
    """
    Find an existing transaction by its reference.

    The current ORM uses `reference` as the idempotency/reference field.
    """

    return (
        db.query(XPTransaction)
        .filter(
            XPTransaction.reference == reference,
        )
        .first()
    )


def player_xp(
    db: Session,
    player_id: int,
) -> int:
    """
    Return lifetime net XP for a player.

    XP is calculated from the immutable transaction ledger.
    """

    result = (
        db.query(
            func.coalesce(
                func.sum(XPTransaction.amount),
                0,
            )
        )
        .filter(
            XPTransaction.player_id == player_id,
        )
        .scalar()
    )

    return int(result or 0)


def player_current_xp(
    db: Session,
    player_id: int,
) -> int:
    """
    Current XP currently equals lifetime net XP.

    Kept separate so a spendable/current XP system can be introduced later.
    """

    return player_xp(
        db,
        player_id,
    )


def get_player_balance(
    db: Session,
    player_id: int,
) -> XPBalance:
    lifetime = player_xp(
        db,
        player_id,
    )

    current = player_current_xp(
        db,
        player_id,
    )

    return XPBalance(
        player_id=player_id,
        lifetime_xp=lifetime,
        current_xp=current,
    )


def group_xp(
    db: Session,
    group_id: int | None = None,
    programme_id: int | None = None,
) -> int:
    """
    Calculate collective XP from the transaction ledger.

    Group XP is stored directly on XP transactions so historical XP
    does not move when a player changes groups.

    If group_id is supplied it takes precedence over programme_id.
    """

    query = db.query(
        func.coalesce(
            func.sum(XPTransaction.group_amount),
            0,
        )
    )

    if group_id is not None:
        query = query.filter(
            XPTransaction.group_id == group_id,
        )

    elif programme_id is not None:
        query = (
            query
            .join(
                YouthGroup,
                YouthGroup.id == XPTransaction.group_id,
            )
            .filter(
                YouthGroup.programme_id == programme_id,
            )
        )

    result = query.scalar()

    return int(result or 0)


def programme_xp(
    db: Session,
    programme_id: int,
) -> int:
    """
    Collective XP across all groups in a programme.
    """

    return group_xp(
        db,
        programme_id=programme_id,
    )


def get_transaction_by_reference(
    db: Session,
    reference: str,
) -> XPTransaction | None:
    return _find_reference(
        db,
        reference,
    )


def award_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    group_amount: int = 0,
    transaction_type: str,
    reason: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
    reference: str | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Create one XP ledger transaction.

    IMPORTANT:
    This function does not commit.

    The caller owns the transaction so related operations can be
    committed atomically.

    `reference` is used as an idempotency key when supplied.
    """

    amount = _validate_amount(
        amount,
        field_name="amount",
    )

    if group_amount != 0:
        group_amount = _validate_amount(
            group_amount,
            field_name="group_amount",
        )
    else:
        group_amount = 0

    if not transaction_type:
        raise XPError(
            "transaction_type is required."
        )

    if not reason:
        raise XPError(
            "reason is required."
        )

    player = _get_player(
        db,
        player_id,
    )

    if reference:
        existing = _find_reference(
            db,
            reference,
        )

        if existing is not None:
            if (
                existing.player_id != player.id
                or existing.amount != amount
                or existing.group_amount != group_amount
            ):
                raise DuplicateXPTransactionError(
                    "An XP transaction already exists "
                    "for this reference with different values."
                )

            return existing

    transaction = XPTransaction(
        programme_id=programme_id,
        player_id=player_id,
        group_id=player.group_id,
        amount=amount,
        group_amount=group_amount,
        type=transaction_type,
        reason=reason,
        reference_type=reference_type,
        reference_id=reference_id,
        reference=reference,
        created_by=created_by,
    )

    db.add(transaction)
    db.flush()

    return transaction


def award_positive_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    group_amount: int = 0,
    transaction_type: str,
    reason: str,
    reference: str | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Convenience API for normal positive rewards.
    """

    amount = _validate_amount(
        amount,
        field_name="amount",
    )

    if amount < 0:
        raise InvalidXPAmountError(
            "Positive XP amount required."
        )

    if group_amount < 0:
        raise InvalidXPAmountError(
            "Positive group XP amount required."
        )

    return award_xp(
        db=db,
        programme_id=programme_id,
        player_id=player_id,
        amount=amount,
        group_amount=group_amount,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        created_by=created_by,
    )


def award_penalty_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    reason: str,
    reference: str | None = None,
    created_by: int | None = None,
    transaction_type: str = "penalty",
) -> XPTransaction:
    """
    Create an individual negative XP transaction.

    The caller supplies the penalty magnitude as a positive number.
    """

    amount = _validate_amount(
        amount,
        field_name="amount",
    )

    amount = abs(amount)

    return award_xp(
        db=db,
        programme_id=programme_id,
        player_id=player_id,
        amount=-amount,
        group_amount=0,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        created_by=created_by,
    )


def award_group_penalty_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    reason: str,
    reference: str | None = None,
    created_by: int | None = None,
    transaction_type: str = "group_penalty",
) -> XPTransaction:
    """
    Remove XP from the collective pool.

    Individual player XP is unchanged.
    """

    amount = _validate_amount(
        amount,
        field_name="amount",
    )

    amount = abs(amount)

    return award_xp(
        db=db,
        programme_id=programme_id,
        player_id=player_id,
        amount=0,
        group_amount=-amount,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        created_by=created_by,
    )


def transactions_for_player(
    db: Session,
    player_id: int,
) -> list[XPTransaction]:
    return (
        db.query(XPTransaction)
        .filter(
            XPTransaction.player_id == player_id,
        )
        .order_by(
            XPTransaction.created_at.desc(),
            XPTransaction.id.desc(),
        )
        .all()
    )


def transactions_for_group(
    db: Session,
    group_id: int,
) -> list[XPTransaction]:
    return (
        db.query(XPTransaction)
        .filter(
            XPTransaction.group_id == group_id,
        )
        .order_by(
            XPTransaction.created_at.desc(),
            XPTransaction.id.desc(),
        )
        .all()
    )


def transaction_to_dict(
    transaction: XPTransaction,
) -> dict:
    return {
        "id": transaction.id,
        "programme_id": transaction.programme_id,
        "player_id": transaction.player_id,
        "group_id": transaction.group_id,
        "amount": transaction.amount,
        "group_amount": transaction.group_amount,
        "type": transaction.type,
        "reason": transaction.reason,
        "reference_type": transaction.reference_type,
        "reference_id": transaction.reference_id,
        "reference": transaction.reference,
        "created_by": transaction.created_by,
        "created_at": transaction.created_at,
    }


def balance_from_transactions(
    transactions: Iterable[XPTransaction],
) -> int:
    return sum(
        transaction.amount
        for transaction in transactions
    )