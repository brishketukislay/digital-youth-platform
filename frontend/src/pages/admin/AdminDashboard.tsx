import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  adminOverview,
  adminPlayers,
  startAttendance,
} from "../../api/client";

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>();
  const [players, setPlayers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>();

  async function load() {
    const [o, p] = await Promise.all([
      adminOverview(),
      adminPlayers(),
    ]);

    setOverview(o.data);
    setPlayers(p.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createAttendance() {
    const response = await startAttendance();
    setAttendance(response.data);
  }

  return (
    <Layout title="Administration">
      <div className="hero">
        <h1>Programme Control Centre</h1>
        <p>
          Configure and operate the youth platform.
        </p>
      </div>

      {overview && (
        <div className="grid">
          <div className="card">
            <h2>Players</h2>
            <div className="xp">
              {overview.players}
            </div>
          </div>

          <div className="card">
            <h2>Group XP</h2>
            <div className="xp">
              {overview.group_xp.toLocaleString()}
            </div>
          </div>

          <div className="card">
            <h2>Programme</h2>
            <h3>{overview.programme}</h3>
          </div>

          <div className="card">
            <h2>Attendance</h2>

            <button
              className="btn"
              onClick={createAttendance}
            >
              Start Session
            </button>

            {attendance && (
              <>
                <p>Ask players to enter:</p>

                <div className="big-code">
                  {attendance.code}
                </div>

                <p className="muted">
                  Code expires in approximately 10 minutes.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Players</h2>

        {players.map(player => (
          <div
            className="leaderboard-row"
            key={player.id}
          >
            <div>{player.avatar}</div>
            <strong>{player.gamertag}</strong>
            <strong>
              {player.xp.toLocaleString()} XP
            </strong>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Configuration</h2>

        <p>
          The next administration sections are designed
          around configuration rather than hard-coded
          programme logic:
        </p>

        <ul>
          <li>Programme settings</li>
          <li>Maps and locations</li>
          <li>Phases and phase pins</li>
          <li>Colours and themes</li>
          <li>XP rules</li>
          <li>Rewards</li>
          <li>Challenges</li>
          <li>Resources</li>
          <li>Player accounts</li>
        </ul>
      </section>
    </Layout>
  );
}
