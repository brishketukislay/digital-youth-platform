// import axios from "axios";

// export const api = axios.create({
//   baseURL:
//     import.meta.env.VITE_API_URL ||
//     "http://localhost:8000/api",

//   withCredentials: true,
// });


// // ============================================================
// // AUTH
// // ============================================================

// export async function login(
//   username: string,
//   password: string
// ) {
//   return api.post(
//     "/auth/login",
//     {
//       username,
//       password,
//     }
//   );
// }


// export async function logout() {
//   return api.post(
//     "/auth/logout"
//   );
// }


// export async function me() {
//   return api.get(
//     "/auth/me"
//   );
// }


// // ============================================================
// // PLAYER
// // ============================================================

// export async function playerDashboard() {
//   return api.get(
//     "/player/dashboard"
//   );
// }


// export async function playerAvatars() {
//   return api.get(
//     "/player/avatars"
//   );
// }


// // ============================================================
// // PUBLIC
// // ============================================================

// export async function publicDashboard() {
//   return api.get(
//     "/public/dashboard"
//   );
// }


// export async function leaderboard() {
//   return api.get(
//     "/leaderboard"
//   );
// }


// // ============================================================
// // ADMIN OVERVIEW
// // ============================================================

// export async function adminOverview() {
//   return api.get(
//     "/admin/overview"
//   );
// }


// export async function adminPlayers() {
//   return api.get(
//     "/admin/players"
//   );
// }


// // ============================================================
// // PROGRAMME
// // ============================================================

// export async function getProgramme() {
//   return api.get(
//     "/admin/programme"
//   );
// }


// export async function updateProgramme(
//   data: any
// ) {
//   return api.put(
//     "/admin/programme",
//     data
//   );
// }


// // ============================================================
// // THEMES
// // ============================================================

// export async function getThemes() {
//   return api.get(
//     "/admin/themes"
//   );
// }


// export async function createTheme(
//   data: any
// ) {
//   return api.post(
//     "/admin/themes",
//     data
//   );
// }


// export async function updateTheme(
//   id: number,
//   data: any
// ) {
//   return api.put(
//     `/admin/themes/${id}`,
//     data
//   );
// }


// export async function activateTheme(
//   id: number
// ) {
//   return api.post(
//     `/admin/themes/${id}/activate`
//   );
// }


// // ============================================================
// // MAPS
// // ============================================================

// export async function getMaps() {
//   return api.get(
//     "/admin/maps"
//   );
// }


// export async function createMap(
//   data: any
// ) {
//   return api.post(
//     "/admin/maps",
//     data
//   );
// }


// export async function updateMap(
//   id: number,
//   data: any
// ) {
//   return api.put(
//     `/admin/maps/${id}`,
//     data
//   );
// }


// export async function activateMap(
//   id: number
// ) {
//   return api.post(
//     `/admin/maps/${id}/activate`
//   );
// }


// export async function getMapLocations(
//   mapId: number
// ) {
//   return api.get(
//     `/admin/maps/${mapId}/locations`
//   );
// }


// export async function createMapLocation(
//   mapId: number,
//   data: any
// ) {
//   return api.post(
//     `/admin/maps/${mapId}/locations`,
//     data
//   );
// }


// export async function updateMapLocation(
//   id: number,
//   data: any
// ) {
//   return api.put(
//     `/admin/maps/locations/${id}`,
//     data
//   );
// }


// // ============================================================
// // PHASES
// // ============================================================

// export async function getPhases() {
//   return api.get(
//     "/admin/phases"
//   );
// }


// export async function createPhase(
//   data: any
// ) {
//   return api.post(
//     "/admin/phases",
//     data
//   );
// }


// // ============================================================
// // XP RULES
// // ============================================================

// export async function getPointRules() {
//   return api.get(
//     "/admin/point-rules"
//   );
// }


// export async function createPointRule(
//   data: any
// ) {
//   return api.post(
//     "/admin/point-rules",
//     data
//   );
// }


// export async function updatePointRule(
//   id: number,
//   data: any
// ) {
//   return api.put(
//     `/admin/point-rules/${id}`,
//     data
//   );
// }


// // ============================================================
// // REWARDS
// // ============================================================

// export async function getRewards() {
//   return api.get(
//     "/admin/rewards"
//   );
// }


// export async function createReward(
//   data: any
// ) {
//   return api.post(
//     "/admin/rewards",
//     data
//   );
// }


// // ============================================================
// // XP
// // ============================================================

// export async function awardXP(
//   data: {
//     player_id: number;
//     amount: number;
//     reason: string;
//   }
// ) {
//   return api.post(
//     "/admin/xp/award",
//     data
//   );
// }


// // ============================================================
// // ATTENDANCE
// // ============================================================

// export async function startAttendance() {
//   return api.post(
//     "/attendance/start"
//   );
// }


// export async function checkIn(
//   code: string
// ) {
//   return api.post(
//     "/attendance/check-in",
//     {
//       code,
//     }
//   );
// }
import axios from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api",
  withCredentials: true,
});

export async function login(
  username: string,
  password: string
) {
  return api.post("/auth/login", {
    username,
    password,
  });
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

export async function checkIn(
  code: string
) {
  return api.post(
    "/attendance/check-in",
    { code }
  );
}

/*
 * Community awards
 */

export async function createCommunityAward(
  payload: {
    player_id?: number;
    group_id?: number;
    category: string;
    description: string;
    submitted_by_name: string;
    submitted_by_contact: string;
  }
) {
  return api.post(
    "/community/awards",
    payload
  );
}

export async function adminCommunityAwards() {
  return api.get(
    "/admin/community-awards"
  );
}

export async function reviewCommunityAward(
  id: number,
  status: "approved" | "rejected"
) {
  return api.post(
    `/admin/community-awards/${id}/review`,
    { status }
  );
}

/*
 * XP
 */

export async function awardXP(
  playerId: number,
  amount: number,
  reason: string
) {
  return api.post("/admin/xp/award", {
    player_id: playerId,
    amount,
    reason,
  });
}

/*
 * Themes
 */

export async function getThemes() {
  return api.get("/admin/themes");
}

export async function createTheme(
  payload: {
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  }
) {
  return api.post(
    "/admin/themes",
    payload
  );
}

/*
 * Phases
 */

export async function createPhase(
  payload: {
    name: string;
    description?: string;
    colour?: string;
    icon?: string;
  }
) {
  return api.post(
    "/admin/phases",
    payload
  );
}

/*
 * Resources
 */

export async function getResources() {
  return api.get("/resources");
}

/*
 * Challenges
 */

export async function getChallenges() {
  return api.get("/challenges");
}