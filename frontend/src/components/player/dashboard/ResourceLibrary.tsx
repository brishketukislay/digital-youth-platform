import {
  useMemo,
  useState,
} from "react";

import type {
  DashboardSectionProps,
} from "./dashboardTypes";

import {
  DashboardCard,
  StatusPill,
} from "./DashboardPrimitives";

interface Resource {
  id?: string | number;

  title?: string;
  name?: string;

  description?: string;
  summary?: string;

  type?: string;
  category?: string;

  url?: string;
  href?: string;

  thumbnail_url?: string;
  thumbnailUrl?: string;

  duration?: string;
  duration_minutes?: number;
  durationMinutes?: number;

  phase_id?: string | number;
  phaseId?: string | number;

  phase_name?: string;
  phaseName?: string;

  unlocked?: boolean;
  is_unlocked?: boolean;
  isUnlocked?: boolean;

  completed?: boolean;
  is_completed?: boolean;
  isCompleted?: boolean;

  progress?: number;

  icon?: string;
}

interface NormalisedResource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  phaseId: string | null;
  phaseName: string | null;
  unlocked: boolean;
  completed: boolean;
  progress: number;
  icon: string;
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: string;
    label: string;
    colour: string;
  }
> = {
  video: {
    icon: "▶",
    label: "Video",
    colour: "#ef4444",
  },

  guide: {
    icon: "📖",
    label: "Guide",
    colour: "#38bdf8",
  },

  article: {
    icon: "📄",
    label: "Article",
    colour: "#6366f1",
  },

  service: {
    icon: "🤝",
    label: "Support",
    colour: "#22c55e",
  },

  activity: {
    icon: "🎯",
    label: "Activity",
    colour: "#a855f7",
  },

  audio: {
    icon: "🎧",
    label: "Audio",
    colour: "#f59e0b",
  },

  tool: {
    icon: "🛠",
    label: "Tool",
    colour: "#14b8a6",
  },

  default: {
    icon: "📚",
    label: "Resource",
    colour: "#94a3b8",
  },
};

const CATEGORY_FILTERS = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "video",
    label: "Videos",
  },
  {
    value: "guide",
    label: "Guides",
  },
  {
    value: "service",
    label: "Support",
  },
  {
    value: "activity",
    label: "Activities",
  },
] as const;

function normaliseType(
  value: unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "default";
  }

  const type =
    value.trim().toLowerCase();

  if (
    Object.prototype.hasOwnProperty.call(
      TYPE_CONFIG,
      type,
    )
  ) {
    return type;
  }

  if (
    type.includes("video")
  ) {
    return "video";
  }

  if (
    type.includes("guide")
  ) {
    return "guide";
  }

  if (
    type.includes("article")
  ) {
    return "article";
  }

  if (
    type.includes("service") ||
    type.includes("support")
  ) {
    return "service";
  }

  if (
    type.includes("activity")
  ) {
    return "activity";
  }

  if (
    type.includes("audio")
  ) {
    return "audio";
  }

  if (
    type.includes("tool")
  ) {
    return "tool";
  }

  return "default";
}

function normaliseProgress(
  value: unknown,
): number {
  if (
    typeof value !==
    "number"
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      value,
    ),
  );
}

function normaliseResource(
  resource: Resource,
  index: number,
): NormalisedResource {
  const type =
    normaliseType(
      resource.type ??
        resource.category,
    );

  const config =
    TYPE_CONFIG[type];

  const unlocked =
    resource.unlocked ??
    resource.is_unlocked ??
    resource.isUnlocked ??
    false;

  const completed =
    resource.completed ??
    resource.is_completed ??
    resource.isCompleted ??
    false;

  const duration =
    resource.duration ??
    (typeof resource.duration_minutes ===
    "number"
      ? `${resource.duration_minutes} min`
      : typeof resource.durationMinutes ===
          "number"
        ? `${resource.durationMinutes} min`
        : null);

  return {
    id: String(
      resource.id ??
        `resource-${index}`,
    ),

    title:
      resource.title ??
      resource.name ??
      "Untitled resource",

    description:
      resource.description ??
      resource.summary ??
      null,

    type,

    category:
      resource.category ??
      null,

    url:
      resource.url ??
      resource.href ??
      null,

    thumbnailUrl:
      resource.thumbnail_url ??
      resource.thumbnailUrl ??
      null,

    duration,

    phaseId:
      resource.phase_id !==
        undefined
      ? String(
          resource.phase_id,
        )
      : resource.phaseId !==
          undefined
        ? String(
            resource.phaseId,
          )
        : null,

    phaseName:
      resource.phase_name ??
      resource.phaseName ??
      null,

    unlocked: Boolean(
      unlocked,
    ),

    completed: Boolean(
      completed,
    ),

    progress:
      normaliseProgress(
        resource.progress,
      ),

    icon:
      resource.icon ??
      config.icon,
  };
}

function getResources(
  data: DashboardSectionProps["data"],
): NormalisedResource[] {
  const source =
    data.resources ??
    data.resource_library ??
    data.resourceLibrary ??
    [];

  if (
    !Array.isArray(source)
  ) {
    return [];
  }

  return source.map(
    (
      resource,
      index,
    ) =>
      normaliseResource(
        resource as Resource,
        index,
      ),
  );
}

function getCurrentPhaseId(
  data: DashboardSectionProps["data"],
): string | null {
  const phase =
    data.current_phase ??
    data.currentPhase;

  if (!phase) {
    return null;
  }

  if (
    typeof phase ===
    "string" ||
    typeof phase ===
      "number"
  ) {
    return String(
      phase,
    );
  }

  if (
    typeof phase ===
      "object" &&
    phase !== null
  ) {
    const value =
      (
        phase as {
          id?: string | number;
        }
      ).id;

    if (
      value !==
      undefined
    ) {
      return String(
        value,
      );
    }
  }

  return null;
}

function getCurrentPhaseName(
  data: DashboardSectionProps["data"],
): string | null {
  const phase =
    data.current_phase ??
    data.currentPhase;

  if (
    typeof phase ===
    "string"
  ) {
    return phase;
  }

  if (
    typeof phase ===
      "object" &&
    phase !== null
  ) {
    const value =
      (
        phase as {
          name?: string;
          title?: string;
        }
      ).name ??
      (
        phase as {
          title?: string;
        }
      ).title;

    return value ?? null;
  }

  return null;
}

function openResource(
  resource: NormalisedResource,
) {
  if (
    !resource.url
  ) {
    return;
  }

  window.open(
    resource.url,
    "_blank",
    "noopener,noreferrer",
  );
}

export function ResourceLibrary({
  data,
}: DashboardSectionProps) {
  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState(
      "all",
    );

  const resources =
    useMemo(
      () =>
        getResources(
          data,
        ),
      [data],
    );

  const currentPhaseId =
    getCurrentPhaseId(
      data,
    );

  const currentPhaseName =
    getCurrentPhaseName(
      data,
    );

  const phaseResources =
    useMemo(() => {
      if (
        !currentPhaseId &&
        !currentPhaseName
      ) {
        return resources;
      }

      const matched =
        resources.filter(
          resource => {
            if (
              currentPhaseId &&
              resource.phaseId ===
                currentPhaseId
            ) {
              return true;
            }

            if (
              currentPhaseName &&
              resource.phaseName
                ?.toLowerCase() ===
                currentPhaseName.toLowerCase()
            ) {
              return true;
            }

            return false;
          },
        );

      /*
       * If the backend has supplied resources
       * but none are explicitly associated with
       * the current phase, don't hide everything.
       */
      return matched.length >
        0
        ? matched
        : resources;
    }, [
      resources,
      currentPhaseId,
      currentPhaseName,
    ]);

  const filteredResources =
    useMemo(() => {
      if (
        activeFilter ===
        "all"
      ) {
        return phaseResources;
      }

      return phaseResources.filter(
        resource =>
          resource.type ===
            activeFilter ||
          resource.category
            ?.toLowerCase() ===
            activeFilter,
      );
    }, [
      activeFilter,
      phaseResources,
    ]);

  const unlockedCount =
    phaseResources.filter(
      resource =>
        resource.unlocked,
    ).length;

  const completedCount =
    phaseResources.filter(
      resource =>
        resource.completed,
    ).length;

  return (
    <DashboardCard
      className="resource-library"
      eyebrow="TOOLS & SUPPORT"
      title="Resource Library"
      action={
        <StatusPill
          status={`${unlockedCount}/${phaseResources.length} available`}
          tone={
            unlockedCount >
            0
              ? "success"
              : "neutral"
          }
        />
      }
    >
      <div className="resource-library__intro">
        <div
          className="resource-library__intro-icon"
          aria-hidden="true"
        >
          📚
        </div>

        <div>
          <strong>
            Resources for your current
            journey
          </strong>

          <p>
            Guides, activities and support
            are unlocked as you progress
            through each phase.
          </p>
        </div>
      </div>

      {currentPhaseName && (
        <div className="resource-library__phase">
          <span>
            Current phase
          </span>

          <strong>
            {currentPhaseName}
          </strong>
        </div>
      )}

      {phaseResources.length >
        0 && (
        <div
          className="resource-library__filters"
          role="tablist"
          aria-label="Resource categories"
        >
          {CATEGORY_FILTERS.map(
            filter => {
              const selected =
                activeFilter ===
                filter.value;

              return (
                <button
                  key={
                    filter.value
                  }
                  type="button"
                  role="tab"
                  aria-selected={
                    selected
                  }
                  className={[
                    "resource-filter",
                    selected
                      ? "resource-filter--active"
                      : "",
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      " ",
                    )}
                  onClick={() =>
                    setActiveFilter(
                      filter.value,
                    )
                  }
                >
                  {
                    filter.label
                  }
                </button>
              );
            },
          )}
        </div>
      )}

      {filteredResources.length ===
      0 ? (
        <div className="resource-library__empty">
          <span
            aria-hidden="true"
          >
            🔎
          </span>

          <div>
            <strong>
              No resources here yet
            </strong>

            <p>
              New resources will appear
              as your youth work team adds
              them to the programme.
            </p>
          </div>
        </div>
      ) : (
        <div className="resource-library__grid">
          {filteredResources.map(
            resource => {
              const config =
                TYPE_CONFIG[
                  resource.type
                ] ??
                TYPE_CONFIG.default;

              const canOpen =
                resource.unlocked &&
                Boolean(
                  resource.url,
                );

              return (
                <article
                  key={
                    resource.id
                  }
                  className={[
                    "resource-card",
                    resource.unlocked
                      ? "resource-card--unlocked"
                      : "resource-card--locked",
                    resource.completed
                      ? "resource-card--completed"
                      : "",
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      " ",
                    )}
                >
                  <div
                    className="resource-card__visual"
                    style={{
                      "--resource-colour":
                        config.colour,
                    } as React.CSSProperties}
                  >
                    {resource.thumbnailUrl &&
                    resource.unlocked ? (
                      <img
                        src={
                          resource.thumbnailUrl
                        }
                        alt=""
                        className="resource-card__thumbnail"
                      />
                    ) : (
                      <span
                        className="resource-card__icon"
                        aria-hidden="true"
                      >
                        {resource.unlocked
                          ? resource.icon
                          : "🔒"}
                      </span>
                    )}

                    <span className="resource-card__type">
                      {
                        config.label
                      }
                    </span>
                  </div>

                  <div className="resource-card__body">
                    <div className="resource-card__heading">
                      <h3>
                        {resource.unlocked
                          ? resource.title
                          : "Locked resource"}
                      </h3>

                      {resource.completed && (
                        <span
                          className="resource-card__complete"
                          title="Completed"
                          aria-label="Completed"
                        >
                          ✓
                        </span>
                      )}
                    </div>

                    {resource.unlocked &&
                      resource.description && (
                        <p>
                          {
                            resource.description
                          }
                        </p>
                      )}

                    {!resource.unlocked && (
                      <p className="resource-card__locked-copy">
                        Continue through the
                        current phase to unlock
                        this resource.
                      </p>
                    )}

                    <div className="resource-card__meta">
                      {resource.phaseName && (
                        <span>
                          {resource.phaseName}
                        </span>
                      )}

                      {resource.duration && (
                        <span>
                          ⏱{" "}
                          {
                            resource.duration
                          }
                        </span>
                      )}
                    </div>

                    {resource.unlocked &&
                      resource.progress >
                        0 &&
                      !resource.completed && (
                        <div className="resource-card__progress">
                          <div
                            className="resource-card__progress-track"
                            aria-hidden="true"
                          >
                            <div
                              className="resource-card__progress-fill"
                              style={{
                                width: `${resource.progress}%`,
                              }}
                            />
                          </div>

                          <span>
                            {Math.round(
                              resource.progress,
                            )}
                            %
                          </span>
                        </div>
                      )}

                    <button
                      type="button"
                      className="resource-card__action"
                      disabled={
                        !canOpen
                      }
                      onClick={() => {
                        if (
                          canOpen
                        ) {
                          openResource(
                            resource,
                          );
                        }
                      }}
                    >
                      {!resource.unlocked
                        ? "Locked"
                        : resource.completed
                          ? "Open again"
                          : "Open resource"}
                    </button>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}

      {phaseResources.length >
        0 && (
        <div className="resource-library__footer">
          <span>
            {completedCount}{" "}
            completed
          </span>

          <span>
            {unlockedCount}{" "}
            available
          </span>
        </div>
      )}
    </DashboardCard>
  );
}