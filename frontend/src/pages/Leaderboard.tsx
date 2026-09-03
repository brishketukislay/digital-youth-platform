import { useEffect, useState } from "react";
import { leaderboard } from "../api/client";

export default function Leaderboard() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const response = await leaderboard();
    setRows(response.data);
  }

  useEffect(() => {
    load();

    const timer = setInterval(load, 15000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container">
      <div className="hero">
        <h1>Leaderboard</h1>
        <p>
          Celebrating progress across the programme.
        </p>
      </div>

      <div className="card">
        {rows.map(row => (
          <div
            className="leaderboard-row"
            key={row.gamertag}
          >
            <div className="rank">
              #{row.rank}
            </div>

            <div>
              <strong>{row.gamertag}</strong>
              <div className="muted">
                {row.avatar}
              </div>
            </div>

            <strong>
              {row.xp.toLocaleString()} XP
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
