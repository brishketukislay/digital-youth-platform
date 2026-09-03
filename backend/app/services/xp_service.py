from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Cohort,
    Group,
    Player,
    XPAccountScope,
    XPSourceType,
    XPTransaction,
)
from app.services.xp_rules import (
    XPError,
    XPAward,
    calculate_multiplier,
    validate_amount,
    validate_cohort_penalty,
    validate_positive_award,
)


class XPService:
    """
    Single entry point for changing XP.

    Controllers/routes should not modify XP directly.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_player_xp(self, player_id: int) -> int:
        return self._get_balance(
            scope=XPAccountScope.PLAYER,
            player_id=player_id,
        )

    def get_group_xp(self, group_id: int) -> int:
        return self._get_balance(
            scope=XPAccountScope.GROUP,
            group_id=group_id,
        )

    def get_cohort_xp(self, cohort_id: int) -> int:
        return self._get_balance(
            scope=XPAccountScope.COHORT,
            cohort_id=cohort_id,
        )

    def award_player(
        self,
        player: Player,
        award: XPAward,
        *,
        created_by_user_id: int | None = None,
    ) -> XPTransaction:
        validate_positive_award(award.amount)

        self._validate_player(player)

        return self._create_transaction(
            scope=XPAccountScope.PLAYER,
            player_id=player.id,
            amount=award.amount,
            source_type=award.source_type,
            source_id=award.source_id,
            reason=award.reason,
            idempotency_key=award.idempotency_key,
            created_by_user_id=created_by_user_id,
        )

    def award_group(
        self,
        group: Group,
        award: XPAward,
        *,
        created_by_user_id: int | None = None,
    ) -> XPTransaction:
        validate_positive_award(award.amount)

        return self._create_transaction(
            scope=XPAccountScope.GROUP,
            group_id=group.id,
            amount=award.amount,
            source_type=award.source_type,
            source_id=award.source_id,
            reason=award.reason,
            idempotency_key=award.idempotency_key,
            created_by_user_id=created_by_user_id,
        )

    def award_cohort(
        self,
        cohort: Cohort,
        award: XPAward,
        *,
        created_by_user_id: int | None = None,
    ) -> XPTransaction:
        validate_positive_award(award.amount)

        return self._create_transaction(
            scope=XPAccountScope.COHORT,
            cohort_id=cohort.id,
            amount=award.amount,
            source_type=award.source_type,
            source_id=award.source_id,
            reason=award.reason,
            idempotency_key=award.idempotency_key,
            created_by_user_id=created_by_user_id,
        )

    def penalise_player(
        self,
        player: Player,
        amount: int,
        *,
        source_id: int | None = None,
        reason: str,
        created_by_user_id: int,
        idempotency_key: str | None = None,
    ) -> XPTransaction:
        """
        Individual deductions never touch the cohort balance.
        """
        validate_amount(amount)

        if amount >= 0:
            raise XPError("Player penalty must be negative.")

        self._validate_player(player)

        return self._create_transaction(
            scope=XPAccountScope.PLAYER,
            player_id=player.id,
            amount=amount,
            source_type=XPSourceType.PENALTY,
            source_id=source_id,
            reason=reason,
            idempotency_key=idempotency_key,
            created_by_user_id=created_by_user_id,
        )

    def penalise_cohort(
        self,
        cohort: Cohort,
        amount: int,
        *,
        reason: str,
        created_by_user_id: int,
        source_id: int | None = None,
        idempotency_key: str | None = None,
    ) -> XPTransaction:
        """
        Exceptional group loss.

        This is deliberately separate from player penalties so an
        individual incident cannot accidentally reduce the jackpot.
        """
        validate_amount(amount)

        if amount >= 0:
            raise XPError("Cohort penalty must be negative.")

        current_xp = self.get_cohort_xp(cohort.id)

        validate_cohort_penalty(
            amount,
            current_xp=current_xp,
            target_xp=cohort.target_xp,
        )

        return self._create_transaction(
            scope=XPAccountScope.COHORT,
            cohort_id=cohort.id,
            amount=amount,
            source_type=XPSourceType.GROUP_PENALTY,
            source_id=source_id,
            reason=reason,
            idempotency_key=idempotency_key,
            created_by_user_id=created_by_user_id,
        )

    def calculate_multiplier(
        self,
        base_amount: int,
        multiplier: float,
        *,
        maximum: int | None = None,
    ) -> int:
        return calculate_multiplier(
            base_amount,
            multiplier,
            maximum=maximum,
        )

    def _create_transaction(
        self,
        *,
        scope: XPAccountScope,
        amount: int,
        source_type: str | XPSourceType,
        player_id: int | None = None,
        group_id: int | None = None,
        cohort_id: int | None = None,
        source_id: int | None = None,
        reason: str | None = None,
        idempotency_key: str | None = None,
        created_by_user_id: int | None = None,
    ) -> XPTransaction:
        validate_amount(amount)

        existing = self._get_by_idempotency_key(
            idempotency_key
        )

        if existing is not None:
            return existing

        self._validate_scope(
            scope=scope,
            player_id=player_id,
            group_id=group_id,
            cohort_id=cohort_id,
        )

        transaction = XPTransaction(
            scope=scope,
            player_id=player_id,
            group_id=group_id,
            cohort_id=cohort_id,
            amount=amount,
            source_type=source_type,
            source_id=source_id,
            reason=reason,
            idempotency_key=idempotency_key,
            created_by_user_id=created_by_user_id,
        )

        self.db.add(transaction)
        self.db.flush()

        return transaction

    def _get_balance(
        self,
        *,
        scope: XPAccountScope,
        player_id: int | None = None,
        group_id: int | None = None,
        cohort_id: int | None = None,
    ) -> int:
        query = select(
            func.coalesce(func.sum(XPTransaction.amount), 0)
        ).where(
            XPTransaction.scope == scope,
        )

        if scope == XPAccountScope.PLAYER:
            query = query.where(
                XPTransaction.player_id == player_id
            )

        elif scope == XPAccountScope.GROUP:
            query = query.where(
                XPTransaction.group_id == group_id
            )

        elif scope == XPAccountScope.COHORT:
            query = query.where(
                XPTransaction.cohort_id == cohort_id
            )

        return int(self.db.scalar(query) or 0)

    def _get_by_idempotency_key(
        self,
        idempotency_key: str | None,
    ) -> XPTransaction | None:
        if not idempotency_key:
            return None

        return self.db.scalar(
            select(XPTransaction).where(
                XPTransaction.idempotency_key
                == idempotency_key
            )
        )

    def _validate_scope(
        self,
        *,
        scope: XPAccountScope,
        player_id: int | None,
        group_id: int | None,
        cohort_id: int | None,
    ) -> None:
        supplied = [
            player_id is not None,
            group_id is not None,
            cohort_id is not None,
        ]

        if sum(supplied) != 1:
            raise XPError(
                "Exactly one XP account target is required."
            )

        if scope == XPAccountScope.PLAYER and player_id is None:
            raise XPError("Player XP requires a player.")

        if scope == XPAccountScope.GROUP and group_id is None:
            raise XPError("Group XP requires a group.")

        if scope == XPAccountScope.COHORT and cohort_id is None:
            raise XPError("Cohort XP requires a cohort.")

    @staticmethod
    def _validate_player(player: Player) -> None:
        if not player.active:
            raise XPError(
                "XP cannot be awarded to an inactive player."
            )
