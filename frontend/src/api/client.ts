import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

export async function login(username: string, password: string) {
  return api.post("/auth/login", { username, password });
}

export async function logout() {
  return api.post("/auth/logout");
}

export async function me() {
  return api.get("/auth/me");
}

export async function playerDashboard() {
  return api.get("/player/dashboard");
}

export async function leaderboard() {
  return api.get("/leaderboard");
}

export async function publicDashboard() {
  return api.get("/public/dashboard");
}

export async function adminOverview() {
  return api.get("/admin/overview");
}

export async function adminPlayers() {
  return api.get("/admin/players");
}

export async function startAttendance() {
  return api.post("/attendance/start");
}

export async function checkIn(code: string) {
  return api.post("/attendance/check-in", { code });
}
