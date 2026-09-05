from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.group_xp_balance import GroupXPBalance
from app.models.player_xp_balance import PlayerXPBalance
from app.models.xp_transaction import XPTransaction
from app.services.xp.exceptions import (
    XPInsufficientBalance,
    XPValidationError,
)
from app.services.xp.types import XPAward, XPResult


class XPService:
    """
    Single authoritative entry point for XP mutations.

    Routes, background jobs and admin actions should use this service
    rather than changing XP balances directly.
    """

    def __init__(self, db: Session):
        self.db = db

    def apply(
        self,
        operation: XPAward,
        *,
        affect_group: bool = True,
    ) -> XPResult:
        self._validate(operation)

        existing = self._get_existing_transaction(
            operation.idempotency_key,
        )

        if existing:
            return self._result_from_existing(existing)

        transaction = XPTransaction(
            programme_id=operation.programme_id,
            player_id=operation.player_id,
            cohort_id=operation.cohort_id,
            transaction_type=operation.transaction_type,
            amount=operation.amount,
            source_type=operation.source_type,
            source_id=operation.source_id,
            idempotency_key=operation.idempotency_key,
            created_by_user_id=operation.created_by_user_id,
            reason=operation.reason,
            metadata_json=operation.metadata or {},
        )

        self.db.add(transaction)

        player_balance = None

        if operation.player_id is not None:
            player_balance = self._update_player_balance(
                operation,
            )

        group_balance = None

        if (
            affect_group
            and operation.cohort_id is not None
        ):
            group_balance = self._update_group_balance(
                operation,
            )

        self.db.flush()

        return XPResult(
            transaction_id=transaction.id,
            amount=operation.amount,
            player_balance=player_balance,
            group_balance=group_balance,
        )

    def _validate(self, operation: XPAward) -> None:
        if operation.amount == 0:
            raise XPValidationError(
                "XP transaction amount cannot be zero."
            )

        if operation.player_id is None and operation.cohort_id is None:
            raise XPValidationError(
                "An XP transaction must target a player or cohort."
            )

        if not operation.idempotency_key.strip():
            raise XPValidationError(
                "An idempotency key is required."
            )

        if operation.amount < 0 and operation.player_id is None:
            raise XPValidationError(
                "Negative XP requires a player target."
            )

    def _get_existing_transaction(
        self,
        idempotency_key: str,
    ) -> XPTransaction | None:
        return self.db.scalar(
            select(XPTransaction).where(
                XPTransaction.idempotency_key
                == idempotency_key
            )
        )

    def _update_player_balance(
        self,
        operation: XPAward,
    ) -> int:
        balance = self.db.scalar(
            select(PlayerXPBalance)
            .where(
                PlayerXPBalance.player_id
                == operation.player_id
            )
            .with_for_update()
        )

        if balance is None:
            balance = PlayerXPBalance(
                player_id=operation.player_id,
            )
            self.db.add(balance)
            self.db.flush()

        new_balance = balance.current_xp + operation.amount

        if new_balance < 0:
            raise XPInsufficientBalance(
                "Player XP cannot fall below zero."
            )

        balance.current_xp = new_balance

        if operation.amount > 0:
            balance.lifetime_xp += operation.amount
        else:
            balance.lifetime_xp_removed += abs(
                operation.amount
            )

        return balance.current_xp

    def _update_group_balance(
        self,
        operation: XPAward,
    ) -> int:
        balance = self.db.scalar(
            select(GroupXPBalance)
            .where(
                GroupXPBalance.programme_id
                == operation.programme_id
            )
            .with_for_update()
        )

        if balance is None:
            balance = GroupXPBalance(
                programme_id=operation.programme_id,
            )
            self.db.add(balance)
            self.db.flush()

        new_balance = balance.current_xp + operation.amount

        if new_balance < 0:
            raise XPInsufficientBalance(
                "Group XP cannot fall below zero."
            )

        balance.current_xp = new_balance

        if operation.amount > 0:
            balance.lifetime_xp_awarded += operation.amount
        else:
            balance.lifetime_xp_removed += abs(
                operation.amount
            )

        return balance.current_xp

    @staticmethod
    def _result_from_existing(
        transaction: XPTransaction,
    ) -> XPResult:
        return XPResult(
            transaction_id=transaction.id,
            amount=transaction.amount,
            player_balance=None,
            group_balance=None,
        )
