import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  playerDashboard,
  checkIn,
  publicDashboard,
} from "../api/client";

type Location = {
  id: number;
  name: string;
  x: number;
  y: number;
  icon?: string;
};

type Dashboard = {
  player: {
    id: number;
    gamertag: string;
    avatar: string;
    xp: number;
  };
  group_xp: number;
  target_xp: number;
  programme?: {
    name: string;
  };
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  map?: {
    name: string;
    background_image?: string;
    locations: Location[];
  };
  phase?: {
    id: number;
    name: string;
    description?: string;
    colour: string;
    icon: string;
  };
  badges: {
    name: string;
    description?: string;
    colour: string;
  }[];
  skill_tree?: {
    name: string;
    description?: string;
    xp: number;
    milestones: {
      name: string;
      required_xp: number;
      completed: boolean;
      reward?: string;
    }[];
  };
  challenges?: {
    id: number;
    title: string;
    description?: string;
    participation_xp: number;
    elite_xp: number;
    winner_xp: number;
  }[];
};

type PublicData = {
  map?: {
    background_image?: string;
  };
};

const AVATARS: Record<string, string> = {
  "avatar-1": "🦊",
  "avatar-2": "🐼",
  "avatar-3": "🐸",
  "avatar-4": "🐯",
  "avatar-5": "🐺",
  "avatar-6": "🤖",
  "avatar-7": "👾",
  "avatar-8": "🐙",
  "avatar-9": "🦉",
  "avatar-10": "🐻",
  "avatar-11": "🐨",
  "avatar-12": "🦁",
};

function avatarFor(id?: string) {
  return AVATARS[id || "avatar-1"] || "⭐";
}

function formatXP(value: number) {
  return Math.max(0, value || 0).toLocaleString();
}

function progress(current: number, target: number) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
}

export default function PlayerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [publicData, setPublicData] = useState<PublicData | null>(null);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAwardQR, setShowAwardQR] = useState(false);
  const [scratchOpen, setScratchOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);

  async function load() {
    try {
      setLoading(true);

      const [dashboardResponse, publicResponse] =
        await Promise.all([
          playerDashboard(),
          publicDashboard(),
        ]);

      setData(dashboardResponse.data);
      setPublicData(publicResponse.data);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function attend() {
    try {
      setMessage("");

      const response = await checkIn(code);

      setMessage(
        `Checked in! +${response.data.xp || 0} XP`
      );

      setCode("");

      await load();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail ||
          "Unable to check in."
      );
    }
  }

  const groupPercentage = useMemo(() => {
    if (!data) return 0;

    return progress(
      data.group_xp,
      data.target_xp
    );
  }, [data]);

  const skillPercentage = useMemo(() => {
    if (!data?.skill_tree) return 0;

    const milestones = data.skill_tree.milestones || [];

    if (milestones.length === 0) return 0;

    const completed = milestones.filter(
      m => m.completed
    ).length;

    return (completed / milestones.length) * 100;
  }, [data]);

  if (loading) {
    return (
      <Layout>
        <div className="card">
          <h2>Loading your journey...</h2>
          <p className="muted">
            Getting your latest progress.
          </p>
        </div>
      </Layout>
    );
  }

  if (!data?.player) {
    return (
      <Layout>
        <div className="card">
          <h2>Player profile not found</h2>
          <p className="muted">
            Please speak to your youth worker.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={
        data.programme?.name ||
        "Digital Youth Platform"
      }
    >
      {/* HERO */}
      <section className="hero player-hero">
        <div className="player-identity">
          <div className="large-avatar">
            {avatarFor(data.player.avatar)}
          </div>

          <div>
            <div
              className="muted"
              style={{ color: "#d8eee5" }}
            >
              Welcome back
            </div>

            <h1>{data.player.gamertag}</h1>

            <p style={{ opacity: 0.9 }}>
              Your digital journey
            </p>
          </div>
        </div>

        <div className="player-xp-block">
          <div className="xp">
            {formatXP(data.player.xp)} XP
          </div>

          <div className="muted hero-muted">
            Your lifetime XP
          </div>
        </div>
      </section>

      {/* GROUP PROGRESS */}
      <section className="card featured-progress">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              SQUAD PROGRESS
            </div>

            <h2>
              {formatXP(data.group_xp)} XP
            </h2>
          </div>

          <div className="progress-number">
            {Math.round(groupPercentage)}%
          </div>
        </div>

        <div className="progress large-progress">
          <div
            style={{
              width: `${groupPercentage}%`,
            }}
          />
        </div>

        <div className="progress-footer">
          <span>
            Goal: {formatXP(data.target_xp)} XP
          </span>

          <span>
            {formatXP(
              Math.max(
                0,
                data.target_xp - data.group_xp
              )
            )}{" "}
            XP to go
          </span>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <div className="quick-actions">
        <button
          className="action-card"
          onClick={() => setShowAwardQR(true)}
        >
          <span className="action-icon">⭐</span>
          <strong>Community recognition</strong>
          <small>
            Let someone recognise something positive
            you've done.
          </small>
        </button>

        <button
          className="action-card"
          onClick={() => setScratchOpen(true)}
        >
          <span className="action-icon">🎁</span>
          <strong>Mystery reward</strong>
          <small>
            Check whether you've unlocked a surprise.
          </small>
        </button>

        <button
          className="action-card"
          onClick={() => setWheelOpen(true)}
        >
          <span className="action-icon">🎡</span>
          <strong>Loot drop</strong>
          <small>
            Available when a youth worker activates it.
          </small>
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid">
        {/* CURRENT PHASE */}
        <section className="card">
          <div className="card-title-row">
            <h2>Current Phase</h2>

            {data.phase && (
              <span
                className="phase-pill"
                style={{
                  background:
                    data.phase.colour,
                }}
              >
                ACTIVE
              </span>
            )}
          </div>

          {data.phase ? (
            <>
              <div
                className="phase-display"
                style={{
                  borderColor:
                    data.phase.colour,
                }}
              >
                <div
                  className="phase-icon"
                  style={{
                    background:
                      data.phase.colour,
                  }}
                >
                  {data.phase.icon || "⭐"}
                </div>

                <div>
                  <h3>
                    {data.phase.name}
                  </h3>

                  <p className="muted">
                    {data.phase.description ||
                      "Your current programme phase."}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">
              No active phase at the moment.
            </p>
          )}
        </section>

        {/* CHECK IN */}
        <section className="card">
          <h2>Session Check-in</h2>

          <p className="muted">
            Enter the code shown by your youth worker.
          </p>

          <input
            value={code}
            onChange={event =>
              setCode(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              )
            }
            inputMode="numeric"
            maxLength={6}
            placeholder="6 digit code"
          />

          <button
            className="btn"
            onClick={attend}
            disabled={code.length !== 6}
          >
            Check in
          </button>

          {message && (
            <div className="notice">
              {message}
            </div>
          )}
        </section>

        {/* SKILL TREE */}
        <section className="card">
          <div className="card-title-row">
            <h2>Skill Tree</h2>

            <span className="percentage-badge">
              {Math.round(skillPercentage)}%
            </span>
          </div>

          {data.skill_tree ? (
            <>
              <h3>
                {data.skill_tree.name}
              </h3>

              <p className="muted">
                {data.skill_tree.description}
              </p>

              <div className="progress skill-progress">
                <div
                  style={{
                    width: `${skillPercentage}%`,
                  }}
                />
              </div>

              <div className="skill-tree">
                {data.skill_tree.milestones.map(
                  milestone => (
                    <div
                      key={milestone.name}
                      className={
                        milestone.completed
                          ? "skill-node completed"
                          : "skill-node"
                      }
                    >
                      <div className="skill-node-icon">
                        {milestone.completed
                          ? "✓"
                          : "○"}
                      </div>

                      <div>
                        <strong>
                          {milestone.name}
                        </strong>

                        <small>
                          {milestone.required_xp.toLocaleString()}{" "}
                          XP
                        </small>

                        {milestone.reward && (
                          <small className="muted">
                            {milestone.reward}
                          </small>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span>🌱</span>
              <p>
                Your next skill goal will appear here.
              </p>
            </div>
          )}
        </section>

        {/* BADGES */}
        <section className="card">
          <h2>Your Badge Cabinet</h2>

          {data.badges.length === 0 ? (
            <div className="empty-state">
              <span>🏆</span>

              <p>
                Your badge cabinet is waiting for its
                first achievement.
              </p>
            </div>
          ) : (
            <div className="badge-grid">
              {data.badges.map((badge, index) => (
                <div
                  key={`${badge.name}-${index}`}
                  className="badge"
                  style={{
                    background:
                      badge.colour ||
                      "var(--primary)",
                  }}
                  title={badge.description}
                >
                  <span>🏆</span>

                  <strong>
                    {badge.name}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* CHALLENGES */}
      {data.challenges &&
        data.challenges.length > 0 && (
          <section className="card section-gap">
            <div className="card-title-row">
              <div>
                <div className="eyebrow">
                  LIVE GAMEPLAY
                </div>

                <h2>
                  Current Challenges
                </h2>
              </div>

              <span className="live-dot">
                LIVE
              </span>
            </div>

            <div className="challenge-grid">
              {data.challenges.map(challenge => (
                <div
                  className="challenge-card"
                  key={challenge.id}
                >
                  <div className="challenge-icon">
                    ⚡
                  </div>

                  <h3>
                    {challenge.title}
                  </h3>

                  <p className="muted">
                    {challenge.description}
                  </p>

                  <div className="challenge-rewards">
                    <div>
                      <small>
                        Participation
                      </small>
                      <strong>
                        +
                        {challenge.participation_xp.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Elite
                      </small>
                      <strong>
                        +
                        {challenge.elite_xp.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Winner
                      </small>
                      <strong>
                        +
                        {challenge.winner_xp.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* MAP */}
      {data.map && (
        <section className="card section-gap">
          <div className="card-title-row">
            <div>
              <div className="eyebrow">
                YOUR WORLD
              </div>

              <h2>{data.map.name}</h2>
            </div>

            <span className="map-status">
              ● LIVE
            </span>
          </div>

          <div
            className="game-map"
            style={{
              backgroundImage:
                data.map.background_image
                  ? `url(${data.map.background_image})`
                  : undefined,
            }}
          >
            {!data.map.background_image && (
              <div className="map-placeholder">
                <span>🗺️</span>
                <strong>
                  {data.map.name}
                </strong>
              </div>
            )}

            {data.map.locations.map(location => (
              <div
                key={location.id}
                className="map-pin enhanced-map-pin"
                title={location.name}
                style={{
                  left: `${location.x * 100}%`,
                  top: `${location.y * 100}%`,
                }}
              >
                <span>
                  {location.icon &&
                  location.icon.length <= 4
                    ? location.icon
                    : "📍"}
                </span>

                <small>
                  {location.name}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PUBLIC AWARD MODAL */}
      {showAwardQR && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setShowAwardQR(false)
          }
        >
          <div
            className="modal"
            onClick={event =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() =>
                setShowAwardQR(false)
              }
            >
              ×
            </button>

            <div className="modal-icon">
              ⭐
            </div>

            <h2>
              Community recognition
            </h2>

            <p className="muted">
              Show this screen to someone who has
              seen you doing something positive.
            </p>

            <div className="qr-placeholder">
              <div className="qr-inner">
                {data.player.gamertag}
              </div>
            </div>

            <div className="qr-code-text">
              {data.player.gamertag}
            </div>

            <p className="small-muted">
              The community member will only see your
              anonymous gamertag.
            </p>
          </div>
        </div>
      )}

      {/* SCRATCH CARD */}
      {scratchOpen && (
        <ScratchCard
          onClose={() =>
            setScratchOpen(false)
          }
        />
      )}

      {/* LOOT WHEEL */}
      {wheelOpen && (
        <LootWheel
          onClose={() =>
            setWheelOpen(false)
          }
        />
      )}
    </Layout>
  );
}

function ScratchCard({
  onClose,
}: {
  onClose: () => void;
}) {
  const [revealed, setRevealed] =
    useState(false);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal scratch-modal"
        onClick={event =>
          event.stopPropagation()
        }
      >
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="modal-icon">
          🎁
        </div>

        <h2>Mystery Drop</h2>

        <p className="muted">
          Your youth worker has activated a mystery
          reward.
        </p>

        <button
          className={`scratch-card ${
            revealed ? "revealed" : ""
          }`}
          onClick={() =>
            setRevealed(true)
          }
        >
          {!revealed ? (
            <>
              <span>✋</span>
              <strong>
                TAP TO REVEAL
              </strong>
            </>
          ) : (
            <>
              <span>⭐</span>
              <strong>
                MYSTERY REWARD
              </strong>
              <small>
                Reward awaiting staff validation
              </small>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LootWheel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [spinning, setSpinning] =
    useState(false);
  const [result, setResult] =
    useState<string | null>(null);

  const prizes = [
    "+500 XP",
    "+1,000 XP",
    "+1,500 XP",
    "+2,000 XP",
    "+3,500 XP",
  ];

  function spin() {
    if (spinning) return;

    setSpinning(true);
    setResult(null);

    setTimeout(() => {
      const prize =
        prizes[
          Math.floor(
            Math.random() * prizes.length
          )
        ];

      setResult(prize);
      setSpinning(false);
    }, 1800);
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal wheel-modal"
        onClick={event =>
          event.stopPropagation()
        }
      >
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="modal-icon">
          🎡
        </div>

        <h2>Loot Drop</h2>

        <p className="muted">
          A limited-use positive behaviour reward.
        </p>

        <div
          className={`loot-wheel ${
            spinning ? "spinning" : ""
          }`}
        >
          <div className="wheel-centre">
            ⭐
          </div>
        </div>

        {result && (
          <div className="wheel-result">
            <small>
              YOU UNLOCKED
            </small>

            <strong>{result}</strong>
          </div>
        )}

        <button
          className="btn"
          onClick={spin}
          disabled={spinning}
        >
          {spinning
            ? "Spinning..."
            : result
            ? "Spin again"
            : "Spin"}
        </button>

        <p className="small-muted">
          Rewards should be validated by staff before
          being added to the official XP ledger.
        </p>
      </div>
    </div>
  );
}