import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from "react";

interface CardProps
  extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  variant?:
    | "default"
    | "accent"
    | "dark"
    | "success"
    | "warning";
}

export function DashboardCard({
  children,
  title,
  eyebrow,
  action,
  variant = "default",
  className = "",
  ...props
}: PropsWithChildren<CardProps>) {
  return (
    <section
      {...props}
      className={[
        "dashboard-card",
        `dashboard-card--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(eyebrow || title || action) && (
        <div className="dashboard-card__header">
          <div>
            {eyebrow && (
              <div className="dashboard-card__eyebrow">
                {eyebrow}
              </div>
            )}

            {title && (
              <h2 className="dashboard-card__title">
                {title}
              </h2>
            )}
          </div>

          {action && (
            <div className="dashboard-card__action">
              {action}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-card__body">
        {children}
      </div>
    </section>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  accent?: string;
  icon?: ReactNode;
}

export function DashboardStat({
  label,
  value,
  description,
  accent,
  icon,
}: StatProps) {
  return (
    <div className="dashboard-stat">
      {icon && (
        <div className="dashboard-stat__icon">
          {icon}
        </div>
      )}

      <div className="dashboard-stat__content">
        <span className="dashboard-stat__label">
          {label}
        </span>

        <strong
          className="dashboard-stat__value"
          style={
            accent
              ? { color: accent }
              : undefined
          }
        >
          {value}
        </strong>

        {description && (
          <span className="dashboard-stat__description">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  label?: string;
  valueLabel?: ReactNode;
  colour?: string;
  height?: "small" | "medium" | "large";
  showPercentage?: boolean;
}

export function ProgressBar({
  value,
  label,
  valueLabel,
  colour,
  height = "medium",
  showPercentage = false,
}: ProgressBarProps) {
  const percentage = Math.min(
    100,
    Math.max(
      0,
      Number.isFinite(value)
        ? value
        : 0,
    ),
  );

  return (
    <div className="dashboard-progress">
      {(label || valueLabel || showPercentage) && (
        <div className="dashboard-progress__header">
          {label && (
            <span>
              {label}
            </span>
          )}

          <span>
            {valueLabel}

            {showPercentage && (
              <>
                {valueLabel
                  ? " · "
                  : ""}
                {Math.round(
                  percentage,
                )}
                %
              </>
            )}
          </span>
        </div>
      )}

      <div
        className={[
          "dashboard-progress__track",
          `dashboard-progress__track--${height}`,
        ].join(" ")}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(
          percentage,
        )}
      >
        <div
          className="dashboard-progress__fill"
          style={{
            width: `${percentage}%`,
            background:
              colour ??
              "var(--player-primary, #22c55e)",
          }}
        />
      </div>
    </div>
  );
}

interface XPBadgeProps {
  xp: number;
  size?: "small" | "medium" | "large";
}

export function XPBadge({
  xp,
  size = "medium",
}: XPBadgeProps) {
  return (
    <span
      className={[
        "xp-badge",
        `xp-badge--${size}`,
      ].join(" ")}
      aria-label={`${xp.toLocaleString()} experience points`}
    >
      <span
        className="xp-badge__icon"
        aria-hidden="true"
      >
        ✦
      </span>

      <span className="xp-badge__value">
        {xp.toLocaleString()} XP
      </span>
    </span>
  );
}

interface AvatarProps {
  avatar?: string | null;
  gamertag?: string | null;
  size?: "small" | "medium" | "large" | "xlarge";
  frame?: string | null;
  muted?: boolean;
}

export function PlayerAvatar({
  avatar,
  gamertag,
  size = "medium",
  frame,
  muted = false,
}: AvatarProps) {
  return (
    <div
      className={[
        "player-avatar",
        `player-avatar--${size}`,
        frame
          ? `player-avatar--${frame}`
          : "",
        muted
          ? "player-avatar--muted"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={
        gamertag
          ? `Avatar for ${gamertag}`
          : "Player avatar"
      }
    >
      <span
        className="player-avatar__image"
        aria-hidden="true"
      >
        {avatar || "⭐"}
      </span>
    </div>
  );
}

interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function DashboardIconButton({
  label,
  children,
  className = "",
  ...props
}: PropsWithChildren<IconButtonProps>) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={label}
      title={label}
      className={[
        "dashboard-icon-button",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function DashboardEmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="dashboard-empty-state">
      {icon && (
        <div
          className="dashboard-empty-state__icon"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3>
        {title}
      </h3>

      {description && (
        <p className="muted">
          {description}
        </p>
      )}

      {action && (
        <div className="dashboard-empty-state__action">
          {action}
        </div>
      )}
    </div>
  );
}

interface StatusPillProps {
  status: string;
  tone?:
    | "neutral"
    | "success"
    | "warning"
    | "danger"
    | "info";
}

export function StatusPill({
  status,
  tone = "neutral",
}: StatusPillProps) {
  return (
    <span
      className={[
        "status-pill",
        `status-pill--${tone}`,
      ].join(" ")}
    >
      <span
        className="status-pill__dot"
        aria-hidden="true"
      />

      {status}
    </span>
  );
}

interface SectionGridProps
  extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
}

export function SectionGrid({
  children,
  columns = 2,
  className = "",
  ...props
}: PropsWithChildren<SectionGridProps>) {
  return (
    <div
      {...props}
      className={[
        "dashboard-grid",
        `dashboard-grid--${columns}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}