import type { ReactNode } from "react";

export function ProgressBar({
  value,
  className = "",
  colour,
  ariaLabel,
}: {
  value: number;
  className?: string;
  colour?: string;
  ariaLabel: string;
}) {
  const safeValue = Math.min(
    100,
    Math.max(0, value),
  );

  return (
    <div
      className={`progress ${className}`.trim()}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(
        safeValue,
      )}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="progress__fill"
        style={{
          width: `${safeValue}%`,
          background:
            colour ??
            "var(--primary)",
        }}
      />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-title-row">
      <div>
        {eyebrow && (
          <div className="eyebrow">
            {eyebrow}
          </div>
        )}

        <h2>{title}</h2>
      </div>

      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span
        className="empty-state__icon"
        aria-hidden="true"
      >
        {icon}
      </span>

      <strong>{title}</strong>

      <p>{description}</p>
    </div>
  );
}