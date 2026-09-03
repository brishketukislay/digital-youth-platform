from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import (
    Group,
    Player,
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
    XP is always represented as an integer.

    Negative XP is permitted because the PRD explicitly supports
    individual penalties and exceptional group deductions.

    What is forbidden is malformed/non-integer XP or zero-value
    transactions.
    """

    if isinstance(amount, bool):
        raise InvalidXPAmountError(
            f"{field_name} must be an integer."
        )

    try:
        value = int(amount)
    except (
        TypeError,
        ValueError,
    ) as exc:
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
    player = db.get(
        Player,
        player_id,
    )

    if player is None:
        raise PlayerNotFoundError(
            f"Player {player_id} was not found."
        )

    return player


def _find_reference(
    db: Session,
    reference: str,
) -> XPTransaction | None:
    return (
        db.query(XPTransaction)
        .filter(
            XPTransaction.reference
            == reference,
        )
        .first()
    )


def player_xp(
    db: Session,
    player_id: int,
) -> int:
    """
    Return lifetime net XP for a player.

    This is calculated from the immutable ledger rather than trusting
    the cached Player field.
    """

    result = (
        db.query(
            func.coalesce(
                func.sum(
                    XPTransaction.amount
                ),
                0,
            )
        )
        .filter(
            XPTransaction.player_id
            == player_id,
        )
        .scalar()
    )

    return int(result or 0)


def player_current_xp(
    db: Session,
    player_id: int,
) -> int:
    """
    Current XP is currently equivalent to lifetime net XP.

    Keeping this as a separate API is deliberate: later the platform
    can introduce spendable/current XP while retaining lifetime XP.
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
    Calculate group XP from the transaction ledger.

    Group XP is stored on transactions because an individual action
    can contribute to the collective pool.

    When group_id is supplied it takes precedence over programme_id.
    """

    query = (
        db.query(
            func.coalesce(
                func.sum(
                    XPTransaction.group_amount
                ),
                0,
            )
        )
        .join(
            Player,
            Player.id
            == XPTransaction.player_id,
        )
        .join(
            Group,
            Group.id
            == Player.group_id,
        )
    )

    if group_id is not None:
        query = query.filter(
            Group.id == group_id
        )
    elif programme_id is not None:
        query = query.filter(
            Group.programme_id
            == programme_id
        )

    result = query.scalar()

    return int(result or 0)


def programme_xp(
    db: Session,
    programme_id: int,
) -> int:
    """
    Collective XP across all groups belonging to a programme.
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
    player_id: int,
    amount: int,
    group_amount: int = 0,
    transaction_type: str,
    reason: str,
    reference: str | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Create one XP ledger transaction.

    IMPORTANT:
    This function does not commit.

    The caller owns the transaction so a complete operation such as:

        challenge attempt
        + attempt status
        + XP transaction

    can be committed atomically.

    `reference` is the idempotency key. If supplied, the same reference
    can never produce two XP transactions.
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
                existing.player_id
                != player.id
                or existing.amount
                != amount
                or existing.group_amount
                != group_amount
            ):
                raise DuplicateXPTransactionError(
                    "An XP transaction already exists "
                    "for this reference with different values."
                )

            return existing

    transaction = XPTransaction(
        player_id=player.id,
        amount=amount,
        group_amount=group_amount,
        type=transaction_type,
        reason=reason,
        reference=reference,
        created_by=created_by,
    )

    db.add(transaction)
    db.flush()

    return transaction


def award_positive_xp(
    db: Session,
    *,
    player_id: int,
    amount: int,
    group_amount: int = 0,
    transaction_type: str,
    reason: str,
    reference: str | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Convenience API for normal rewards.

    This prevents accidental negative rewards from being sent through
    attendance/challenge/civic-action code.
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
    player_id: int,
    amount: int,
    reason: str,
    reference: str | None = None,
    created_by: int | None = None,
    transaction_type: str = "penalty",
) -> XPTransaction:
    """
    Create an individual negative XP transaction.

    The caller passes the magnitude as a positive number:

        amount=300

    The ledger records:

        -300

    This makes penalty code much harder to accidentally invert.
    """

    amount = _validate_amount(
        amount,
        field_name="amount",
    )

    if amount < 0:
        amount = abs(amount)

    return award_xp(
        db=db,
        player_id=player_id,
        amount=-amount,
        group_amount=0,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        created_by=created_by,
    )


def award_group_xp(
    db: Session,
    *,
    player_id: int,
    group_amount: int,
    reason: str,
    reference: str | None = None,
    created_by: int | None = None,
    transaction_type: str = "group",
) -> XPTransaction:
    """
    Award XP exclusively to the collective pool.

    `amount=0` is not permitted by award_xp, so group-only rewards use
    a zero individual amount directly through this helper's internal
    transaction construction.
    """

    group_amount = _validate_amount(
        group_amount,
        field_name="group_amount",
    )

    if group_amount < 0:
        raise InvalidXPAmountError(
            "Use award_group_penalty_xp for negative group XP."
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
                or existing.amount != 0
                or existing.group_amount
                != group_amount
            ):
                raise DuplicateXPTransactionError(
                    "An XP transaction already exists "
                    "for this reference with different values."
                )

            return existing

    transaction = XPTransaction(
        player_id=player.id,
        amount=0,
        group_amount=group_amount,
        type=transaction_type,
        reason=reason,
        reference=reference,
        created_by=created_by,
    )

    db.add(transaction)
    db.flush()

    return transaction


def award_group_penalty_xp(
    db: Session,
    *,
    player_id: int,
    amount: int,
    reason: str,
    reference: str | None = None,
    created_by: int | None = None,
    transaction_type: str = "group_penalty",
) -> XPTransaction:
    """
    Remove XP from the collective pool.

    This is intentionally a separate API from individual penalties.

    The PRD's exceptional group loss protocol must never be implemented
    by simply changing an individual's amount.
    """

    amount = _validate_amount(
        amount,
        field_name="amount",
    )

    if amount < 0:
        amount = abs(amount)

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
                or existing.amount != 0
                or existing.group_amount
                != -amount
            ):
                raise DuplicateXPTransactionError(
                    "An XP transaction already exists "
                    "for this reference with different values."
                )

            return existing

    transaction = XPTransaction(
        player_id=player.id,
        amount=0,
        group_amount=-amount,
        type=transaction_type,
        reason=reason,
        reference=reference,
        created_by=created_by,
    )

    db.add(transaction)
    db.flush()

    return transaction


def transactions_for_player(
    db: Session,
    player_id: int,
) -> list[XPTransaction]:
    return (
        db.query(XPTransaction)
        .filter(
            XPTransaction.player_id
            == player_id,
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
        .join(
            Player,
            Player.id
            == XPTransaction.player_id,
        )
        .filter(
            Player.group_id
            == group_id,
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
        "player_id": transaction.player_id,
        "amount": transaction.amount,
        "group_amount": transaction.group_amount,
        "type": transaction.type,
        "reason": transaction.reason,
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
