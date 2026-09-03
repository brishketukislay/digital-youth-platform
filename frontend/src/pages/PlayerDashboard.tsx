import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  playerDashboard,
  checkIn,
} from "../api/client";

type Dashboard = any;

export default function PlayerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await playerDashboard();
    setData(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function attend() {
    try {
      const response = await checkIn(code);
      setMessage(`Checked in! +${response.data.xp} XP`);
      setCode("");
      await load();
    } catch (e: any) {
      setMessage(
        e?.response?.data?.detail ||
        "Unable to check in."
      );
    }
  }

  if (!data) {
    return <div className="container">Loading...</div>;
  }

  const percentage = Math.min(
    100,
    (data.group_xp / data.target_xp) * 100
  );

  return (
    <Layout>
      <section className="hero">
        <div className="muted" style={{ color: "#d8eee5" }}>
          Welcome back
        </div>

        <h1>{data.player.gamertag}</h1>

        <div className="xp">
          {data.player.xp.toLocaleString()} XP
        </div>

        <p>
          Your squad:{" "}
          {data.group_xp.toLocaleString()} XP
        </p>

        <div className="progress">
          <div style={{ width: `${percentage}%` }} />
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Current Phase</h2>

          {data.phase ? (
            <>
              <h3 style={{ color: data.phase.colour }}>
                {data.phase.icon} {data.phase.name}
              </h3>
              <p className="muted">
                {data.phase.description}
              </p>
            </>
          ) : (
            <p>No active phase.</p>
          )}
        </section>

        <section className="card">
          <h2>Session Check-in</h2>
          <p className="muted">
            Enter the code shown by your youth worker.
          </p>

          <input
            value={code}
            onChange={e =>
              setCode(
                e.target.value
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

          {message && <p>{message}</p>}
        </section>

        <section className="card">
          <h2>Skill Tree</h2>

          {data.skill_tree ? (
            <>
              <h3>{data.skill_tree.name}</h3>
              <p className="muted">
                {data.skill_tree.description}
              </p>

              {data.skill_tree.milestones.map(
                (m: any) => (
                  <div key={m.name} style={{ marginBottom: 14 }}>
                    <strong>{m.name}</strong>
                    <div className="progress" style={{
                      background: "#e7efeb",
                      marginTop: 6
                    }}>
                      <div
                        style={{
                          width: m.completed ? "100%" : "0%",
                        }}
                      />
                    </div>
                    <small className="muted">
                      {m.required_xp.toLocaleString()} XP
                    </small>
                  </div>
                )
              )}
            </>
          ) : (
            <p>No skill tree assigned yet.</p>
          )}
        </section>

        <section className="card">
          <h2>Your Badges</h2>

          {data.badges.length === 0 ? (
            <p className="muted">
              Your badge cabinet is waiting for its first achievement.
            </p>
          ) : (
            data.badges.map((badge: any) => (
              <div key={badge.name} style={{
                display: "inline-block",
                margin: 8,
                padding: 16,
                borderRadius: 14,
                background: badge.colour,
                color: "white"
              }}>
                🏆 {badge.name}
              </div>
            ))
          )}
        </section>
      </div>

      {data.map && (
        <section className="card" style={{ marginTop: 20 }}>
          <h2>{data.map.name}</h2>

          <div className="map">
            {data.map.locations.map((location: any) => (
              <div
                key={location.id}
                className="map-pin"
                title={location.name}
                style={{
                  left: `${location.x * 100}%`,
                  top: `${location.y * 100}%`,
                }}
              >
                📍
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
