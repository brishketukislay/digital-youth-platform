from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import require_roles
from ..db.database import get_db
from ..db.models import Player, Programme
from ..services.xp import (
    DuplicateXPTransactionError,
    InvalidXPAmountError,
    PlayerNotFoundError,
    XPError,
    award_xp,
    get_player_balance,
    programme_xp,
    transactions_for_player,
    transaction_to_dict,
)


router = APIRouter(
    prefix="/api/xp",
    tags=["XP Operations"],
)


# ============================================================
# REQUEST MODELS
# ============================================================


class XPAwardRequest(BaseModel):
    player_id: int = Field(..., ge=1)

    amount: int = Field(
        ...,
        ge=-50_000,
        le=50_000,
    )

    reason: str = Field(
        ...,
        min_length=3,
        max_length=500,
    )

    transaction_type: str = Field(
        default="staff_award",
        min_length=1,
        max_length=100,
    )

    group_amount: int = Field(
        default=0,
        ge=-50_000,
        le=50_000,
    )

    reference_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    reference_id: int | None = Field(
        default=None,
        ge=1,
    )

    idempotency_key: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )


# ============================================================
# HELPERS
# ============================================================


def get_active_programme(
    db: Session,
) -> Programme:
    programme = (
        db.query(Programme)
        .filter(
            Programme.active.is_(True),
        )
        .first()
    )

    if programme is None:
        raise HTTPException(
            status_code=404,
            detail="No active programme configured.",
        )

    return programme


def get_active_player(
    db: Session,
    player_id: int,
) -> Player:
    player = (
        db.query(Player)
        .filter(
            Player.id == player_id,
            Player.active.is_(True),
        )
        .first()
    )

    if player is None:
        raise HTTPException(
            status_code=404,
            detail="Player not found.",
        )

    if player.suspended:
        raise HTTPException(
            status_code=400,
            detail="Player is suspended.",
        )

    return player


# ============================================================
# AWARD XP
# ============================================================


@router.post("/awards")
def create_xp_award(
    payload: XPAwardRequest,
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Create an XP ledger transaction.

    The endpoint delegates all XP business rules to services.xp.award_xp().
    """

    programme = get_active_programme(db)
    player = get_active_player(
        db,
        payload.player_id,
    )

    if payload.reference_type is not None and payload.reference_id is None:
        raise HTTPException(
            status_code=400,
            detail="reference_id is required when reference_type is provided.",
        )

    if payload.reference_id is not None and payload.reference_type is None:
        raise HTTPException(
            status_code=400,
            detail="reference_type is required when reference_id is provided.",
        )

    try:
        transaction = award_xp(
            db,
            programme_id=programme.id,
            player_id=player.id,
            amount=payload.amount,
            group_amount=payload.group_amount,
            transaction_type=payload.transaction_type,
            reason=payload.reason,
            reference_type=payload.reference_type,
            reference_id=payload.reference_id,
            idempotency_key=payload.idempotency_key,
            created_by=user.id,
        )

        db.commit()
        db.refresh(transaction)

    except (
        InvalidXPAmountError,
        DuplicateXPTransactionError,
        PlayerNotFoundError,
        XPError,
        ValueError,
    ) as exc:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return {
        "success": True,
        "transaction": transaction_to_dict(
            transaction,
        ),
        "balance": {
            "player_id": player.id,
            "lifetime_xp": get_player_balance(
                db,
                player.id,
            ).lifetime_xp,
            "current_xp": get_player_balance(
                db,
                player.id,
            ).current_xp,
        },
        "programme_xp": programme_xp(
            db,
            programme.id,
        ),
    }


# ============================================================
# PLAYER BALANCE
# ============================================================


@router.get("/players/{player_id}/balance")
def get_xp_balance(
    player_id: int,
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    player = get_active_player(
        db,
        player_id,
    )

    balance = get_player_balance(
        db,
        player.id,
    )

    programme = get_active_programme(db)

    return {
        "player_id": balance.player_id,
        "lifetime_xp": balance.lifetime_xp,
        "current_xp": balance.current_xp,
        "programme_xp": programme_xp(
            db,
            programme.id,
        ),
    }


# ============================================================
# PLAYER XP HISTORY
# ============================================================


@router.get("/players/{player_id}/transactions")
def get_xp_transactions(
    player_id: int,
    limit: int = 50,
    offset: int = 0,
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    get_active_player(
        db,
        player_id,
    )

    limit = max(
        1,
        min(limit, 100),
    )

    offset = max(
        0,
        offset,
    )

    transactions = transactions_for_player(
        db,
        player_id,
    )

    total = len(transactions)

    items = transactions[
        offset:offset + limit
    ]

    return {
        "items": [
            transaction_to_dict(
                transaction,
            )
            for transaction in items
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# ============================================================
# PROGRAMME XP
# ============================================================


@router.get("/programme")
def get_programme_xp_balance(
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    programme = get_active_programme(db)

    return {
        "programme_id": programme.id,
        "programme": programme.name,
        "xp": programme_xp(
            db,
            programme.id,
        ),
        "target_xp": programme.target_xp or 0,
    }
