import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import PlayerDashboard from "./pages/PlayerDashboard";
import Leaderboard from "./pages/Leaderboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { me } from "./api/client";

function Protected({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const [state, setState] = useState<
    "loading" | "ok" | "no"
  >("loading");

  useEffect(() => {
    me()
      .then(response => {
        if (
          roles &&
          !roles.includes(response.data.role)
        ) {
          setState("no");
        } else {
          setState("ok");
        }
      })
      .catch(() => setState("no"));
  }, []);

  if (state === "loading") {
    return (
      <div className="container">
        Loading...
      </div>
    );
  }

  if (state === "no") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/player"
          element={
            <Protected roles={["player"]}>
              <PlayerDashboard />
            </Protected>
          }
        />

        <Route
          path="/admin"
          element={
            <Protected roles={["admin", "youth_worker"]}>
              <AdminDashboard />
            </Protected>
          }
        />

        <Route
          path="/leaderboard"
          element={<Leaderboard />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
