class XPError(Exception):
    """Base exception for XP operations."""


class XPValidationError(XPError):
    """Raised when an XP operation violates a business rule."""


class XPIdempotencyConflict(XPError):
    """Raised when an idempotency key is already used differently."""


class XPInsufficientBalance(XPError):
    """Raised when an XP deduction would create an invalid balance."""
