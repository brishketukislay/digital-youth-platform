from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class XPError(ValueError):
    """Raised when an XP operation violates a domain rule."""


class XPSubject(str, Enum):
    PLAYER = "player"
    GROUP = "group"
    COHORT = "cohort"


@dataclass(frozen=True)
class XPAward:
    amount: int
    reason: str
    source_type: str
    source_id: int | None = None
    idempotency_key: str | None = None


@dataclass(frozen=True)
class XPCap:
    """
    Optional cap applied to a calculated award.

    A cap is applied to the award amount, not the lifetime balance.
    """

    maximum: int | None = None

    def apply(self, amount: int) -> int:
        if amount < 0:
            return amount

        if self.maximum is None:
            return amount

        return min(amount, self.maximum)


def validate_amount(amount: int) -> None:
    if not isinstance(amount, int):
        raise XPError("XP amount must be an integer.")

    if amount == 0:
        raise XPError("XP transaction cannot be zero.")


def validate_positive_award(amount: int) -> None:
    validate_amount(amount)

    if amount < 0:
        raise XPError("Positive XP award cannot be negative.")


def validate_penalty(amount: int) -> None:
    validate_amount(amount)

    if amount >= 0:
        raise XPError("Penalty amount must be negative.")


def calculate_multiplier(
    amount: int,
    multiplier: float,
    *,
    maximum: int | None = None,
) -> int:
    """
    Calculate a rounded XP award after applying a multiplier.

    Example:
        500 × 1.5 = 750

    Multipliers are intentionally calculated here rather than stored
    as separate XP transactions.
    """
    if amount < 0:
        raise XPError("Multipliers cannot be applied to negative awards.")

    if multiplier <= 0:
        raise XPError("Multiplier must be greater than zero.")

    calculated = round(amount * multiplier)

    if maximum is not None:
        calculated = min(calculated, maximum)

    return calculated


def validate_cohort_penalty(
    amount: int,
    *,
    current_xp: int,
    target_xp: int,
    maximum_percentage: float = 0.10,
) -> None:
    """
    Validate the exceptional collective deduction rule.

    A single deduction cannot exceed the configured percentage of the
    cohort target.
    """
    validate_penalty(amount)

    if target_xp <= 0:
        raise XPError("Cohort target XP must be greater than zero.")

    maximum_loss = int(target_xp * maximum_percentage)

    if abs(amount) > maximum_loss:
        raise XPError(
            f"Cohort penalty cannot exceed {maximum_loss:,} XP."
        )

    # Do not allow the collective balance to become negative.
    if current_xp + amount < 0:
        raise XPError(
            "Cohort XP cannot become negative."
        )
