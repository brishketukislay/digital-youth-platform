from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db.database import get_db

try:
    from sqlalchemy.orm import Session
except ImportError:  # pragma: no cover
    Session = object  # type: ignore


router = APIRouter(
    prefix="/xp",
    tags=["XP Operations"],
)


class XPAwardRequest(BaseModel):
    amount: int = Field(..., ge=1, le=1_000_000)
    reason: str = Field(..., min_length=1, max_length=500)

    programme_id: int | None = None
    player_id: int | None = None
    group_id: int | None = None

    transaction_type: str = Field(
        default="manual_award",
        min_length=1,
        max_length=100,
    )

    idempotency_key: str | None = Field(
        default=None,
        max_length=255,
    )

    reference_type: str | None = Field(
        default=None,
        max_length=100,
    )

    reference_id: int | None = None

    created_by: int | None = None


@router.post("/awards")
def create_xp_award(
    payload: XPAwardRequest,
    db: Session = Depends(get_db),
):
    """
    Create an XP transaction using the platform's existing XPTransaction model.

    The endpoint validates the award target at the API boundary.
    Authentication/authorisation remains handled by the existing application
    security layer.
    """

    if payload.player_id is None and payload.group_id is None:
        raise HTTPException(
            status_code=400,
            detail="player_id or group_id is required",
        )

    if payload.player_id is not None and payload.group_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Provide either player_id or group_id, not both",
        )

    from app.db.models.core import XPTransaction

    if payload.idempotency_key:
        existing = (
            db.query(XPTransaction)
            .filter(
                XPTransaction.idempotency_key
                == payload.idempotency_key
            )
            .first()
        )

        if existing is not None:
            return {
                "id": existing.id,
                "programme_id": existing.programme_id,
                "player_id": existing.player_id,
                "group_id": existing.group_id,
                "amount": existing.amount,
                "group_amount": existing.group_amount,
                "transaction_type": existing.transaction_type,
                "idempotency_key": existing.idempotency_key,
                "reason": existing.reason,
                "reference_type": existing.reference_type,
                "reference_id": existing.reference_id,
                "created_by": existing.created_by,
                "created_at": existing.created_at,
                "idempotent_replay": True,
            }

    transaction = XPTransaction(
        programme_id=payload.programme_id,
        player_id=payload.player_id,
        group_id=payload.group_id,
        amount=payload.amount,
        group_amount=payload.amount if payload.group_id else 0,
        transaction_type=payload.transaction_type,
        idempotency_key=payload.idempotency_key,
        reason=payload.reason,
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        created_by=payload.created_by,
        created_at=datetime.now(timezone.utc),
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {
        "id": transaction.id,
        "programme_id": transaction.programme_id,
        "player_id": transaction.player_id,
        "group_id": transaction.group_id,
        "amount": transaction.amount,
        "group_amount": transaction.group_amount,
        "transaction_type": transaction.transaction_type,
        "idempotency_key": transaction.idempotency_key,
        "reason": transaction.reason,
        "reference_type": transaction.reference_type,
        "reference_id": transaction.reference_id,
        "created_by": transaction.created_by,
        "created_at": transaction.created_at,
        "idempotent_replay": False,
    }
