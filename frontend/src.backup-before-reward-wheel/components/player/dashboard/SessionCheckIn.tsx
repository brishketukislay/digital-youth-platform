import { useEffect, useMemo, useState } from "react";
import type {
  DashboardSectionProps,
} from "./dashboardTypes";
import {
  DashboardCard,
  ProgressBar,
  StatusPill,
} from "./DashboardPrimitives";
import {
  formatXP,
} from "./dashboardUtils";

interface CheckInResponse {
  success?: boolean;
  message?: string;
  xp_awarded?: number;
  points_awarded?: number;
  already_checked_in?: boolean;
}

interface SessionCheckInProps
  extends DashboardSectionProps {
  onCheckIn?: () => Promise<
    CheckInResponse | void
  >;
}

function getCheckInState(
  data: DashboardSectionProps["data"],
) {
  const checkIn =
    data.check_in ??
    data.session_check_in ??
    null;

  if (!checkIn) {
    return {
      available: false,
      checkedIn: false,
      xp: 0,
      message: null,
    };
  }

  return {
    available:
      checkIn.available ??
      checkIn.is_available ??
      true,

    checkedIn:
      checkIn.checked_in ??
      checkIn.is_checked_in ??
      false,

    xp:
      typeof checkIn.xp === "number"
        ? checkIn.xp
        : typeof checkIn.xp_awarded ===
            "number"
          ? checkIn.xp_awarded
          : 0,

    message:
      checkIn.message ??
      null,
  };
}

export function SessionCheckIn({
  data,
  onCheckIn,
}: SessionCheckInProps) {
  const initialState =
    useMemo(
      () => getCheckInState(data),
      [data],
    );

  const [
    checkedIn,
    setCheckedIn,
  ] = useState(
    initialState.checkedIn,
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    initialState.message,
  );

  useEffect(() => {
    setCheckedIn(
      initialState.checkedIn,
    );

    setSuccessMessage(
      initialState.message,
    );
  }, [
    initialState.checkedIn,
    initialState.message,
  ]);

  const checkInXP =
    initialState.xp || 500;

  async function handleCheckIn() {
    if (
      isSubmitting ||
      checkedIn ||
      !onCheckIn
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result =
        await onCheckIn();

      if (
        result?.already_checked_in
      ) {
        setCheckedIn(true);
        setSuccessMessage(
          result.message ??
            "You're already checked in for this session.",
        );
        return;
      }

      if (
        result &&
        result.success === false
      ) {
        throw new Error(
          result.message ??
            "We couldn't complete your check-in.",
        );
      }

      setCheckedIn(true);

      const awardedXP =
        result?.xp_awarded ??
        result?.points_awarded ??
        checkInXP;

      setSuccessMessage(
        result?.message ??
          `Check-in complete — ${formatXP(
            awardedXP,
          )} XP added.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't complete your check-in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (
    !initialState.available &&
    !checkedIn
  ) {
    return (
      <DashboardCard
        className="session-check-in"
        eyebrow="SESSION"
        title="Check-in"
      >
        <div className="session-check-in__unavailable">
          <span
            className="session-check-in__icon"
            aria-hidden="true"
          >
            🕐
          </span>

          <div>
            <strong>
              Check-in isn't open yet
            </strong>

            <p className="muted">
              Your youth worker will open
              check-in when the session begins.
            </p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      className="session-check-in"
      eyebrow="SESSION"
      title="Check-in"
      variant={
        checkedIn
          ? "success"
          : "default"
      }
    >
      <div className="session-check-in__content">
        <div
          className={[
            "session-check-in__visual",
            checkedIn
              ? "session-check-in__visual--complete"
              : "",
          ].join(" ")}
        >
          <span aria-hidden="true">
            {checkedIn
              ? "✓"
              : "📱"}
          </span>
        </div>

        <div className="session-check-in__details">
          {checkedIn ? (
            <>
              <StatusPill
                status="Checked in"
                tone="success"
              />

              <h3>
                You're on the board!
              </h3>

              <p>
                Your session check-in has
                been recorded.
              </p>

              {successMessage && (
                <p className="session-check-in__success">
                  {successMessage}
                </p>
              )}
            </>
          ) : (
            <>
              <StatusPill
                status="Check-in open"
                tone="info"
              />

              <h3>
                Ready to check in?
              </h3>

              <p>
                Scan the session QR code
                displayed at the youth work
                hub, then confirm your
                check-in here.
              </p>

              <div className="session-check-in__reward">
                <span>
                  Session reward
                </span>

                <strong>
                  +{formatXP(
                    checkInXP,
                  )} XP
                </strong>
              </div>
            </>
          )}
        </div>
      </div>

      {!checkedIn && (
        <div className="session-check-in__action">
          <button
            type="button"
            className="session-check-in__button"
            onClick={
              handleCheckIn
            }
            disabled={
              isSubmitting ||
              !onCheckIn
            }
          >
            {isSubmitting ? (
              <>
                <span
                  className="session-check-in__spinner"
                  aria-hidden="true"
                />

                Checking in…
              </>
            ) : (
              <>
                Check in
                <span
                  aria-hidden="true"
                >
                  →
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div
          className="session-check-in__error"
          role="alert"
        >
          <span aria-hidden="true">
            ⚠️
          </span>

          <span>
            {error}
          </span>
        </div>
      )}

      {checkedIn && (
        <div className="session-check-in__streak">
          <ProgressBar
            label="Weekly attendance"
            value={
              typeof data.attendance
                ?.weekly_percentage ===
              "number"
                ? data.attendance
                    .weekly_percentage
                : 0
            }
            showPercentage
            colour="#22c55e"
          />
        </div>
      )}
    </DashboardCard>
  );
}