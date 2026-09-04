import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";

/* ============================================================
   API CLIENT
   ============================================================ */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================================================
   SHARED TYPES
   ============================================================ */

export type Role =
  | "admin"
  | "youth_worker"
  | "player";

export type Id = number;

export type ApiError = {
  detail?: string;
  message?: string;
};

export type AuthUser = {
  id: Id;
  username: string;
  role: Role;
};

/* ============================================================
   PROGRAMME
   ============================================================ */

export type Programme = {
  id: Id;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  target_xp: number;
  theme_id?: Id | null;
  map_id?: Id | null;
  phase_id?: Id | null;
};

export type ProgrammeUpdate = {
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  target_xp: number;
};

/* ============================================================
   THEMES
   ============================================================ */

export type Theme = {
  id: Id;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
};

export type ThemeCreate = Omit<Theme, "id">;

/* ============================================================
   MAPS
   ============================================================ */

export type MapLocation = {
  id: Id;
  name: string;
  description?: string | null;
  x: number;
  y: number;
  icon: string;
  active?: boolean;
};

export type GameMap = {
  id: Id;
  name: string;
  description?: string | null;
  background_image?: string | null;
  active?: boolean;
};

export type GameMapCreate = {
  name: string;
  description?: string | null;
  background_image?: string | null;
};

export type MapLocationCreate = {
  name: string;
  description?: string | null;
  x: number;
  y: number;
  icon?: string;
};

/* ============================================================
   PHASES
   ============================================================ */

export type Phase = {
  id: Id;
  name: string;
  description?: string | null;
  colour: string;
  icon: string;
  start_date?: string | null;
  end_date?: string | null;
  active: boolean;
};

export type PhaseCreate = {
  name: string;
  description?: string | null;
  colour?: string;
  icon?: string;
  start_date?: string | null;
  end_date?: string | null;
  active?: boolean;
};

/* ============================================================
   POINT RULES
   ============================================================ */

export type PointRule = {
  id: Id;
  name: string;
  code: string;
  individual_xp: number;
  group_xp: number;
  enabled: boolean;
};

export type PointRuleCreate = {
  name: string;
  code: string;
  individual_xp: number;
  group_xp: number;
  enabled?: boolean;
};

/* ============================================================
   REWARDS
   ============================================================ */

export type RewardType =
  | "individual"
  | "group";

export type Reward = {
  id: Id;
  name: string;
  description?: string | null;
  xp_threshold?: number | null;
  reward_type: RewardType | string;
  value: number;
  active: boolean;
};

export type RewardCreate = {
  name: string;
  description?: string | null;
  xp_threshold?: number | null;
  reward_type?: RewardType | string;
  value?: number;
  active?: boolean;
};

/* ============================================================
   PLAYERS
   ============================================================ */

export type Player = {
  id: Id;
  gamertag: string;
  avatar: string;
  xp: number;
  group_id?: Id | null;
};

/* ============================================================
   ADMIN OVERVIEW
   ============================================================ */

export type AdminOverview = {
  players: number;
  staff: number;
  group_xp: number;
  target_xp: number;
  programme: string;
};

/* ============================================================
   ATTENDANCE
   ============================================================ */

export type AttendanceSession = {
  code: string;
  expires_at?: string;
  expires_in_seconds?: number;
};

export type CheckInResponse = {
  success?: boolean;
  xp: number;
  message?: string;
};

/* ============================================================
   COMMUNITY AWARDS
   ============================================================ */

export type CommunityAwardStatus =
  | "pending"
  | "approved"
  | "rejected";

export type CommunityAward = {
  id: Id;
  player_id?: Id | null;
  group_id?: Id | null;
  category: string;
  description: string;
  submitted_by_name: string;
  submitted_by_contact: string;
  status: CommunityAwardStatus | string;
  xp: number;
  created_at: string;
};

export type CommunityAwardCreate = {
  player_id?: Id;
  group_id?: Id;
  category: string;
  description: string;
  submitted_by_name: string;
  submitted_by_contact: string;
};

/* ============================================================
   CHALLENGES
   ============================================================ */

export type Challenge = {
  id: Id;
  title: string;
  description?: string | null;

  participation_xp: number;
  elite_xp: number;
  winner_xp: number;

  starts_at?: string | null;
  ends_at?: string | null;

  active?: boolean;
};

/* ============================================================
   PLAYER DASHBOARD
   ============================================================ */

export type DashboardLocation = {
  id: Id;
  name: string;
  x: number;
  y: number;
  icon?: string;
};

export type PlayerBadge = {
  name: string;
  description?: string | null;
  colour: string;
};

export type SkillMilestone = {
  name: string;
  required_xp: number;
  completed: boolean;
  reward?: string | null;
};

export type SkillTree = {
  name: string;
  description?: string | null;
  xp: number;
  milestones: SkillMilestone[];
};

export type PlayerDashboardData = {
  player: {
    id: Id;
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
    background_image?: string | null;
    locations: DashboardLocation[];
  };

  phase?: {
    id: Id;
    name: string;
    description?: string | null;
    colour: string;
    icon: string;
  };

  badges: PlayerBadge[];

  skill_tree?: SkillTree | null;

  challenges?: Challenge[];
};

/* ============================================================
   PUBLIC DASHBOARD
   ============================================================ */

export type PublicDashboardData = {
  programme?: {
    name: string;
    description?: string | null;
  };

  group_xp: number;
  target_xp: number;

  map?: {
    name?: string;
    background_image?: string | null;
  };

  phase?: {
    name: string;
    description?: string | null;
    colour?: string;
    icon?: string;
  };

  theme?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
};

export type LeaderboardRow = {
  rank: number;
  gamertag: string;
  avatar: string;
  xp: number;
};

/* ============================================================
   HTTP HELPERS
   ============================================================ */

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    const detail =
      axiosError.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    const message =
      axiosError.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Small wrapper used by pages where we want a consistent
 * error boundary without duplicating axios handling.
 */
export async function request<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}

/* ============================================================
   AUTH
   ============================================================ */

export function login(
  username: string,
  password: string
) {
  return api.post<AuthUser>("/auth/login", {
    username,
    password,
  });
}

export function logout() {
  return api.post("/auth/logout");
}

export function me() {
  return api.get<AuthUser>("/auth/me");
}

/* ============================================================
   PLAYER
   ============================================================ */

export function playerDashboard() {
  return api.get<PlayerDashboardData>(
    "/player/dashboard"
  );
}

export function playerAvatars() {
  return api.get("/player/avatars");
}

/* ============================================================
   PUBLIC
   ============================================================ */

export function publicDashboard() {
  return api.get<PublicDashboardData>(
    "/public/dashboard"
  );
}

export function leaderboard() {
  return api.get<LeaderboardRow[]>(
    "/leaderboard"
  );
}

/* ============================================================
   ADMIN — OVERVIEW
   ============================================================ */

export function adminOverview() {
  return api.get<AdminOverview>(
    "/admin/overview"
  );
}

export function adminPlayers() {
  return api.get<Player[]>(
    "/admin/players"
  );
}

/* ============================================================
   ADMIN — PROGRAMME
   ============================================================ */

export function getProgramme() {
  return api.get<Programme>(
    "/admin/programme"
  );
}

export function updateProgramme(
  payload: ProgrammeUpdate
) {
  return api.put(
    "/admin/programme",
    payload
  );
}

/* ============================================================
   ADMIN — THEMES
   ============================================================ */

export function getThemes() {
  return api.get<Theme[]>(
    "/admin/themes"
  );
}

export function createTheme(
  payload: ThemeCreate
) {
  return api.post<{ id: Id }>(
    "/admin/themes",
    payload
  );
}

export function updateTheme(
  id: Id,
  payload: ThemeCreate
) {
  return api.put(
    `/admin/themes/${id}`,
    payload
  );
}

export function activateTheme(id: Id) {
  return api.post(
    `/admin/themes/${id}/activate`
  );
}

/* ============================================================
   ADMIN — MAPS
   ============================================================ */

export function getMaps() {
  return api.get<GameMap[]>(
    "/admin/maps"
  );
}

export function createMap(
  payload: GameMapCreate
) {
  return api.post<{ id: Id }>(
    "/admin/maps",
    payload
  );
}

export function updateMap(
  id: Id,
  payload: GameMapCreate
) {
  return api.put(
    `/admin/maps/${id}`,
    payload
  );
}

export function activateMap(id: Id) {
  return api.post(
    `/admin/maps/${id}/activate`
  );
}

export function getMapLocations(
  mapId: Id
) {
  return api.get<MapLocation[]>(
    `/admin/maps/${mapId}/locations`
  );
}

export function createMapLocation(
  mapId: Id,
  payload: MapLocationCreate
) {
  return api.post<{ id: Id }>(
    `/admin/maps/${mapId}/locations`,
    payload
  );
}

export function updateMapLocation(
  id: Id,
  payload: MapLocationCreate
) {
  return api.put(
    `/admin/maps/locations/${id}`,
    payload
  );
}

/* ============================================================
   ADMIN — POINT RULES
   ============================================================ */

export function getPointRules() {
  return api.get<PointRule[]>(
    "/admin/point-rules"
  );
}

export function createPointRule(
  payload: PointRuleCreate
) {
  return api.post<{ id: Id }>(
    "/admin/point-rules",
    payload
  );
}

export function updatePointRule(
  id: Id,
  payload: PointRuleCreate
) {
  return api.put(
    `/admin/point-rules/${id}`,
    payload
  );
}

/* ============================================================
   ADMIN — REWARDS
   ============================================================ */

export function getRewards() {
  return api.get<Reward[]>(
    "/admin/rewards"
  );
}

export function createReward(
  payload: RewardCreate
) {
  return api.post<{ id: Id }>(
    "/admin/rewards",
    payload
  );
}

/* ============================================================
   ADMIN — PHASES
   ============================================================ */

export function getPhases() {
  return api.get<Phase[]>(
    "/admin/phases"
  );
}

export function createPhase(
  payload: PhaseCreate
) {
  return api.post<{ id: Id }>(
    "/admin/phases",
    payload
  );
}

/* ============================================================
   ADMIN — USERS
   ============================================================ */

export type CreateUserPayload = {
  username: string;
  password: string;
  role: Role;
  gamertag?: string;
  avatar?: string;
  group_id?: Id;
};

export function createUser(
  payload: CreateUserPayload
) {
  return api.post(
    "/admin/users",
    payload
  );
}

/* ============================================================
   ADMIN — XP
   ============================================================ */

export type AwardXPPayload = {
  player_id: Id;
  amount: number;
  reason: string;
};

export function awardXP(
  playerId: Id,
  amount: number,
  reason: string
) {
  return api.post(
    "/admin/xp/award",
    {
      player_id: playerId,
      amount,
      reason,
    } satisfies AwardXPPayload
  );
}

/* ============================================================
   ATTENDANCE
   ============================================================ */

export function startAttendance() {
  return api.post<AttendanceSession>(
    "/attendance/start"
  );
}

export function checkIn(code: string) {
  return api.post<CheckInResponse>(
    "/attendance/check-in",
    {
      code,
    }
  );
}

/* ============================================================
   COMMUNITY AWARDS
   ============================================================ */

export function createCommunityAward(
  payload: CommunityAwardCreate
) {
  return api.post(
    "/community/awards",
    payload
  );
}

export function adminCommunityAwards() {
  return api.get<CommunityAward[]>(
    "/admin/community-awards"
  );
}

export function reviewCommunityAward(
  id: Id,
  status: "approved" | "rejected"
) {
  return api.post(
    `/admin/community-awards/${id}/review`,
    {
      status,
    }
  );
}

/* ============================================================
   RESOURCES
   ============================================================ */

export type Resource = {
  id: Id;
  title: string;
  description?: string | null;
  url?: string | null;
  type?: string | null;
  phase_id?: Id | null;
  active?: boolean;
};

export function getResources() {
  return api.get<Resource[]>(
    "/resources"
  );
}

/* ============================================================
   CHALLENGES
   ============================================================ */

export function getChallenges() {
  return api.get<Challenge[]>(
    "/challenges"
  );
}
