from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

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


def _get_group(
    db: Session,
    group_id: int,
) -> YouthGroup:
    group = db.get(YouthGroup, group_id)

    if group is None:
        raise GroupNotFoundError(
            f"Group {group_id} was not found."
        )

    return group


def _make_reference(
    reference_type: str | None,
    reference_id: int | None,
) -> str | None:
    """
    Convert database reference fields into the legacy reference string.
    """

    if reference_type is None or reference_id is None:
        return None

    return f"{reference_type}:{reference_id}"


def _parse_reference(
    reference: str | None,
) -> tuple[str | None, int | None]:
    """
    Convert legacy references such as:

        attendance:1
        challenge:7

    into:

        reference_type
        reference_id
    """

    if not reference or ":" not in reference:
        return None, None

    reference_type, reference_id_text = reference.split(":", 1)

    if not reference_type or not reference_id_text:
        return None, None

    try:
        reference_id = int(reference_id_text)
    except ValueError:
        return None, None

    return reference_type, reference_id


def _find_reference(
    db: Session,
    reference: str,
) -> XPTransaction | None:
    """
    Find an existing transaction using the legacy reference string.

    The actual XPTransaction ORM does NOT have a `reference` column.

    References are stored using:

        reference_type
        reference_id
    """

    reference_type, reference_id = _parse_reference(reference)

    if reference_type is None or reference_id is None:
        return None

    return (
        db.query(XPTransaction)
        .filter(
            XPTransaction.reference_type == reference_type,
            XPTransaction.reference_id == reference_id,
        )
        .first()
    )


def player_xp(
    db: Session,
    player_id: int,
) -> int:
    """
    Return lifetime net XP for a player.
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

    Historical group XP remains attached to the group stored on the
    transaction.

    If group_id is supplied, it takes precedence over programme_id.
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
    idempotency_key: str | None = None,
    reference: str | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Create one XP ledger transaction.

    This function does not commit.

    The caller owns the database transaction.

    The actual XPTransaction ORM stores references using:

        reference_type
        reference_id

    A legacy reference such as:

        reference="attendance:1"

    is automatically converted to:

        reference_type="attendance"
        reference_id=1
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

    # ---------------------------------------------------------------
    # Backwards-compatible reference parsing.
    # ---------------------------------------------------------------

    if reference and (
        reference_type is None
        or reference_id is None
    ):
        parsed_type, parsed_id = _parse_reference(
            reference
        )

        if (
            parsed_type is not None
            and parsed_id is not None
        ):
            reference_type = parsed_type
            reference_id = parsed_id

    # ---------------------------------------------------------------
    # Idempotency key.
    #
    # A supplied idempotency key represents the same logical request.
    # Repeating the same key with the same payload returns the original
    # transaction. Reusing it with different values is an error.
    # ---------------------------------------------------------------

    if idempotency_key is not None:
        idempotency_key = idempotency_key.strip()

        if not idempotency_key:
            idempotency_key = None

    if idempotency_key is not None:
        existing = (
            db.query(XPTransaction)
            .filter(
                XPTransaction.idempotency_key == idempotency_key,
            )
            .first()
        )

        if existing is not None:
            if (
                existing.programme_id != programme_id
                or existing.player_id != player_id
                or existing.amount != amount
                or existing.group_amount != group_amount
                or existing.transaction_type != transaction_type
            ):
                raise DuplicateXPTransactionError(
                    "An XP transaction already exists for this "
                    "idempotency key with different values."
                )

            return existing

    # ---------------------------------------------------------------
    # Business-event/reference idempotency.
    # ---------------------------------------------------------------

    if (
        reference_type is not None
        and reference_id is not None
    ):
        existing = (
            db.query(XPTransaction)
            .filter(
                XPTransaction.reference_type == reference_type,
                XPTransaction.reference_id == reference_id,
            )
            .first()
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

    # ---------------------------------------------------------------
    # Create transaction.
    # ---------------------------------------------------------------

    transaction = XPTransaction(
        programme_id=programme_id,
        player_id=player_id,
        group_id=player.group_id,
        amount=amount,
        group_amount=group_amount,
        transaction_type=transaction_type,
        idempotency_key=idempotency_key,
        reason=reason,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )

    # ---------------------------------------------------------------
    # Create transaction inside a savepoint.
    #
    # This allows a uniqueness race to be handled without rolling
    # back the caller's entire database transaction.
    # ---------------------------------------------------------------

    try:
        with db.begin_nested():
            db.add(transaction)
            db.flush()

    except IntegrityError:
        # Another request may have created the same idempotency key
        # or reference between our lookup and flush.
        existing = None

        if idempotency_key is not None:
            existing = (
                db.query(XPTransaction)
                .filter(
                    XPTransaction.idempotency_key == idempotency_key,
                )
                .first()
            )

        if existing is None and (
            reference_type is not None
            and reference_id is not None
        ):
            existing = (
                db.query(XPTransaction)
                .filter(
                    XPTransaction.reference_type == reference_type,
                    XPTransaction.reference_id == reference_id,
                )
                .first()
            )

        if existing is not None:
            if (
                existing.programme_id != programme_id
                or existing.player_id != player.id
                or existing.amount != amount
                or existing.group_amount != group_amount
                or existing.transaction_type != transaction_type
            ):
                raise DuplicateXPTransactionError(
                    "An XP transaction already exists for this "
                    "idempotency key/reference with different values."
                )

            return existing

        raise

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
    reference_type: str | None = None,
    reference_id: int | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Award positive XP.
    """

    amount = abs(
        _validate_amount(
            amount,
            field_name="amount",
        )
    )

    if group_amount:
        group_amount = abs(
            _validate_amount(
                group_amount,
                field_name="group_amount",
            )
        )

    return award_xp(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=amount,
        group_amount=group_amount,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )


def award_individual_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    transaction_type: str,
    reason: str,
    reference: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Award XP to the player without adding group XP.
    """

    return award_positive_xp(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=amount,
        group_amount=0,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )


def award_group_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    transaction_type: str,
    reason: str,
    reference: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Award the same XP amount to the individual and their group.
    """

    amount = abs(
        _validate_amount(
            amount,
            field_name="amount",
        )
    )

    return award_xp(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=amount,
        group_amount=amount,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )


def award_negative_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    group_amount: int = 0,
    transaction_type: str = "penalty",
    reason: str,
    reference: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Deduct XP through a negative ledger transaction.

    The supplied amount may be positive or negative.
    The stored player amount is always negative.
    """

    amount = abs(
        _validate_amount(
            amount,
            field_name="amount",
        )
    )

    if group_amount:
        group_amount = -abs(
            _validate_amount(
                group_amount,
                field_name="group_amount",
            )
        )

    return award_xp(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=-amount,
        group_amount=group_amount,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )


def award_penalty_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    group_amount: int = 0,
    transaction_type: str = "penalty",
    reason: str,
    reference: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Backwards-compatible alias for award_negative_xp.
    """

    return award_negative_xp(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=amount,
        group_amount=group_amount,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )


def award_group_penalty_xp(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    transaction_type: str = "group_penalty",
    reason: str,
    reference: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
    created_by: int | None = None,
) -> XPTransaction:
    """
    Deduct the supplied XP from both the player and their group.
    """

    amount = abs(
        _validate_amount(
            amount,
            field_name="amount",
        )
    )

    return award_negative_xp(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=amount,
        group_amount=amount,
        transaction_type=transaction_type,
        reason=reason,
        reference=reference,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )


def transactions_for_player(
    db: Session,
    player_id: int,
) -> list[XPTransaction]:
    """
    Return a player's XP transactions newest first.
    """

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
    """
    Return a group's XP transactions newest first.
    """

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


def balance_from_transactions(
    transactions: Iterable[XPTransaction],
) -> int:
    """
    Calculate net individual XP from a collection of transactions.
    """

    return sum(
        int(transaction.amount or 0)
        for transaction in transactions
    )


def transaction_to_dict(
    transaction: XPTransaction,
) -> dict:
    """
    Convert an XP transaction to a JSON-friendly dictionary.
    """

    return {
        "id": transaction.id,
        "programme_id": transaction.programme_id,
        "player_id": transaction.player_id,
        "group_id": transaction.group_id,
        "amount": transaction.amount,
        "group_amount": transaction.group_amount,
        "transaction_type": transaction.transaction_type,
        "reason": transaction.reason,
        "reference_type": transaction.reference_type,
        "reference_id": transaction.reference_id,
        "reference": _make_reference(
            transaction.reference_type,
            transaction.reference_id,
        ),
        "created_by": transaction.created_by,
        "created_at": transaction.created_at,
    }
