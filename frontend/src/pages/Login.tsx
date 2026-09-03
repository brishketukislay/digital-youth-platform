import { useState } from "react";
import { login } from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const response = await login(username, password);
      const role = response.data.role;

      if (role === "player") {
        window.location.href = "/player";
      } else {
        window.location.href = "/admin";
      }
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1>Digital Youth Platform</h1>
        <p className="muted">
          Sign in to continue.
        </p>

        {error && (
          <div style={{ color: "#B42318", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <label>Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button className="btn" style={{ width: "100%" }}>
          Sign in
        </button>

        <p className="muted" style={{ marginTop: 20 }}>
          Accounts are created by authorised staff.
        </p>
      </form>
    </div>
  );
}
