import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

/**
 * Central API boundary for the Digital Youth Platform.
 *
 * Important:
 * - The browser never decides authoritative XP.
 * - The browser never sends a player_id for player challenge attempts.
 * - Staff-only operations remain behind the FastAPI authorisation layer.
 * - NFC is intentionally not part of this version.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000/api";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* ============================================================
   COMMON TYPES
   ============================================================ */

export type Id = number;

export type Role =
  | "admin"
  | "youth_worker"
  | "player";

export type ApiSuccess = {
  success: boolean;
};

export type ApiErrorPayload = {
  detail?: string;
  message?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (axios.isAxiosError(error)) {
    const axiosError =
      error as AxiosError<ApiErrorPayload>;

    const detail =
      axiosError.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    const message =
      axiosError.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
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

export async function request<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}

/* ============================================================
   AUTH
   ============================================================ */

export type AuthUser = {
  id: Id;
  username: string;
  role: Role | string;
};

export async function login(
  username: string,
  password: string
) {
  return api.post<AuthUser>("/auth/login", {
    username,
    password,
  });
}

export async function logout() {
  return api.post<ApiSuccess>("/auth/logout");
}

export async function me() {
  return api.get<AuthUser>("/auth/me");
}

/* ============================================================
   PROGRAMME
   ============================================================ */

export type Programme = {
  id: Id;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  target_xp: number;

  /**
   * These are the backend's active_* relationships exposed
   * by the API.
   */
  theme_id: Id | null;
  map_id: Id | null;
  phase_id: Id | null;
};

export type ProgrammeRequest = {
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  target_xp: number;
};

export async function getProgramme() {
  return api.get<Programme>("/admin/programme");
}

export async function updateProgramme(
  data: ProgrammeRequest
) {
  return api.put<ApiSuccess>(
    "/admin/programme",
    data
  );
}

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

export async function adminOverview() {
  return api.get<AdminOverview>(
    "/admin/overview"
  );
}

/* ============================================================
   PLAYERS
   ============================================================ */

export type Player = {
  id: Id;
  gamertag: string;
  avatar: string;
  xp: number;
  group_id: Id | null;
};

export async function adminPlayers() {
  return api.get<Player[]>(
    "/admin/players"
  );
}

export type CreateUserRequest = {
  username: string;
  password: string;
  role: Role;
  gamertag?: string;
  avatar?: string;
  group_id?: Id | null;
};

export async function createUser(
  data: CreateUserRequest
) {
  return api.post<{
    success: boolean;
    id: Id;
  }>("/admin/users", data);
}

/* ============================================================
   XP
   ============================================================ */

export type AwardXPRequest = {
  player_id: Id;
  amount: number;
  reason: string;
};

export type AwardXPResponse = {
  success: boolean;
  xp: number;
};

export async function awardXP(
  playerId: Id,
  amount: number,
  reason: string
) {
  const payload: AwardXPRequest = {
    player_id: playerId,
    amount,
    reason,
  };

  return api.post<AwardXPResponse>(
    "/admin/xp/award",
    payload
  );
}

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
  logo_url?: string | null;
  font_family?: string | null;
  active?: boolean;
  selected?: boolean;
};

export type ThemeRequest = {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  logo_url?: string | null;
  font_family?: string | null;
};

export async function getThemes() {
  return api.get<Theme[]>(
    "/admin/themes"
  );
}

export async function createTheme(
  data: ThemeRequest
) {
  return api.post<{ id: Id }>(
    "/admin/themes",
    data
  );
}

export async function updateTheme(
  id: Id,
  data: ThemeRequest
) {
  return api.put<ApiSuccess>(
    `/admin/themes/${id}`,
    data
  );
}

export async function activateTheme(
  id: Id
) {
  return api.post<ApiSuccess>(
    `/admin/themes/${id}/activate`
  );
}

/* ============================================================
   MAPS
   ============================================================ */

export type GameMap = {
  id: Id;
  name: string;
  description: string | null;
  background_image: string | null;
  active: boolean;
};

export type MapRequest = {
  name: string;
  description?: string | null;
  background_image?: string | null;
};

export type MapLocation = {
  id: Id;
  name: string;
  description: string | null;
  x: number;
  y: number;
  icon: string;
  active: boolean;
};

export type MapLocationRequest = {
  name: string;
  description?: string | null;
  x: number;
  y: number;
  icon?: string;
};

export async function getMaps() {
  return api.get<GameMap[]>(
    "/admin/maps"
  );
}

export async function createMap(
  data: MapRequest
) {
  return api.post<{ id: Id }>(
    "/admin/maps",
    data
  );
}

export async function updateMap(
  id: Id,
  data: MapRequest
) {
  return api.put<ApiSuccess>(
    `/admin/maps/${id}`,
    data
  );
}

export async function activateMap(
  id: Id
) {
  return api.post<ApiSuccess>(
    `/admin/maps/${id}/activate`
  );
}

export async function getMapLocations(
  mapId: Id
) {
  return api.get<MapLocation[]>(
    `/admin/maps/${mapId}/locations`
  );
}

export async function createMapLocation(
  mapId: Id,
  data: MapLocationRequest
) {
  return api.post<{ id: Id }>(
    `/admin/maps/${mapId}/locations`,
    data
  );
}

export async function updateMapLocation(
  id: Id,
  data: MapLocationRequest
) {
  return api.put<ApiSuccess>(
    `/admin/maps/locations/${id}`,
    data
  );
}

/* ============================================================
   PHASES
   ============================================================ */

export type Phase = {
  id: Id;
  name: string;
  description: string | null;
  colour: string;
  icon: string;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};

export type PhaseRequest = {
  name: string;
  description?: string | null;
  colour?: string;
  icon?: string;
  start_date?: string | null;
  end_date?: string | null;
  active?: boolean;
};

export async function getPhases() {
  return api.get<Phase[]>(
    "/admin/phases"
  );
}

export async function createPhase(
  data: PhaseRequest
) {
  return api.post<{ id: Id }>(
    "/admin/phases",
    data
  );
}

export async function updatePhase(
  id: Id,
  data: PhaseRequest
) {
  return api.put<ApiSuccess>(
    `/admin/phases/${id}`,
    data
  );
}

export async function activatePhase(
  id: Id
) {
  return api.post<ApiSuccess>(
    `/admin/phases/${id}/activate`
  );
}

/* ============================================================
   POINT RULES
   ============================================================ */

export type PointRule = {
  id: Id;
  name: string;
  code: string;
  description?: string | null;
  individual_xp: number;
  group_xp: number;
  weekly_cap?: number | null;
  awards_per_week: number;
  enabled: boolean;
};

export type PointRuleRequest = {
  name: string;
  code: string;
  description?: string | null;
  individual_xp: number;
  group_xp: number;
  weekly_cap?: number | null;
  awards_per_week?: number;
  enabled?: boolean;
};

export async function getPointRules() {
  return api.get<PointRule[]>(
    "/admin/point-rules"
  );
}

export async function createPointRule(
  data: PointRuleRequest
) {
  return api.post<{ id: Id }>(
    "/admin/point-rules",
    data
  );
}

export async function updatePointRule(
  id: Id,
  data: PointRuleRequest
) {
  return api.put<ApiSuccess>(
    `/admin/point-rules/${id}`,
    data
  );
}

/* ============================================================
   ADMIN AUDIT LOG
   ============================================================ */

export type AdminAuditLog = {
  id: Id;
  user_id: Id | null;
  action: string;
  entity_type: string | null;
  entity_id: Id | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  username: string | null;
};

export type AdminAuditLogResponse = {
  items: AdminAuditLog[];
  total: number;
  limit: number;
  offset: number;
};

export async function getAdminAuditLogs(
  params: {
    limit?: number;
    offset?: number;
    action?: string;
    user_id?: Id;
  } = {},
) {
  const search = new URLSearchParams();

  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    search.set("offset", String(params.offset));
  }

  if (params.action) {
    search.set("action", params.action);
  }

  if (params.user_id !== undefined) {
    search.set("user_id", String(params.user_id));
  }

  const query = search.toString();

  return api.get<AdminAuditLogResponse>(
    `/admin/audit-logs${query ? `?${query}` : ""}`,
  );
}

/* ============================================================
   REWARDS
   ============================================================ */

export type Reward = {
  id: Id;
  programme_id: Id;
  name: string;
  description: string | null;
  xp_threshold: number | null;
  reward_type: string;
  value: number;
  currency: string;
  badge_id: Id | null;
  mystery: boolean;
  active: boolean;
};

export type RewardRequest = {
  name: string;
  description?: string | null;
  xp_threshold?: number | null;
  reward_type?: string;
  value?: number;
  active?: boolean;
};

export async function getRewards() {
  return api.get<Reward[]>(
    "/admin/rewards"
  );
}

export async function createReward(
  data: RewardRequest
) {
  return api.post<{ id: Id }>(
    "/admin/rewards",
    data
  );
}

export async function updateReward(
  id: Id,
  data: RewardRequest
) {
  return api.put<ApiSuccess>(
    `/admin/rewards/${id}`,
    data
  );
}

export async function disableReward(
  id: Id
) {
  return api.delete<ApiSuccess>(
    `/admin/rewards/${id}`
  );
}

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
  xp?: number;
  message?: string;
};

export async function startAttendance() {
  return api.post<AttendanceSession>(
    "/attendance/start"
  );
}

export async function checkIn(
  code: string
) {
  return api.post<CheckInResponse>(
    "/attendance/check-in",
    { code }
  );
}

/* ============================================================
   COMMUNITY AWARDS
   ============================================================ */

export type CommunityAwardRequest = {
  player_id?: Id;
  group_id?: Id;
  category: string;
  description: string;
  submitted_by_name: string;
  submitted_by_contact: string;
};

export type CommunityAward = {
  id: Id;
  player_id?: Id | null;
  group_id?: Id | null;
  category: string;
  description: string;
  submitted_by_name: string;
  submitted_by_contact: string;
  status: string;
  xp?: number;
  created_at?: string;
};

export async function createCommunityAward(
  payload: CommunityAwardRequest
) {
  return api.post(
    "/community/awards",
    payload
  );
}

export async function adminCommunityAwards() {
  return api.get<CommunityAward[]>(
    "/admin/community-awards"
  );
}

export async function reviewCommunityAward(
  id: Id,
  status: "approved" | "rejected"
) {
  return api.post(
    `/admin/community-awards/${id}/review`,
    { status }
  );
}

/* ============================================================
   PLAYER DASHBOARD
   ============================================================ */

export type PlayerAvatar = {
  id: string;
  name: string;
  emoji: string;
};

export type PlayerBadge = {
  name: string;
  description: string | null;
  colour: string;
};

export type SkillMilestone = {
  name: string;
  required_xp: number;
  completed: boolean;
  reward: string | null;
};

export type PlayerSkillTree = {
  name: string;
  description: string | null;
  xp: number;
  milestones: SkillMilestone[];
};

export type PlayerDashboard = {
  player: {
    id: Id;
    gamertag: string;
    avatar: string;
    xp: number;
  };

  group_xp: number;
  target_xp: number;

  programme: {
    name: string;
  };

  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  } | null;

  map: {
    id: Id;
    name: string;
    background_image: string | null;
    locations: Array<{
      id: Id;
      name: string;
      description: string | null;
      x: number;
      y: number;
      icon: string;
    }>;
  } | null;

  phase: {
    id: Id;
    name: string;
    description: string | null;
    colour: string;
    icon: string;
  } | null;

  badges: PlayerBadge[];

  skill_tree: PlayerSkillTree | null;

  challenges: PlayerChallenge[];

  /*
   * Optional dashboard extensions.
   *
   * These fields allow the player UI to consume the richer
   * dashboard representation without requiring every backend
   * deployment to expose every field immediately.
   */
  lifetime_xp?: number;
  lifetimeXP?: number;
  total_xp?: number;
  totalXP?: number;
  xp?: number;

  current_skill_tree?: PlayerSkillTree | null;
  currentSkillTree?: PlayerSkillTree | null;

  current_phase?: unknown;
  currentPhase?: unknown;

  recent_activity?: unknown[];
  recentActivity?: unknown[];
  activities?: unknown[];
  activity?: unknown[];

  mystery_rewards?: unknown[];
  mysteryRewards?: unknown[];
  mystery_prizes?: unknown[];
  mysteryPrizes?: unknown[];

  resources?: unknown[];
  resource_library?: unknown[];
  resourceLibrary?: unknown[];

  active_challenges?: PlayerChallenge[];
  activeChallenges?: PlayerChallenge[];

  check_in?: unknown;
  session_check_in?: unknown;
  attendance?: unknown;

  checked_in?: boolean;
  checkedIn?: boolean;

  attendance_streak?: number;
  attendanceStreak?: number;
};

export async function playerDashboard() {
  return api.get<PlayerDashboard>(
    "/player/dashboard"
  );
}

export async function playerAvatars() {
  return api.get<PlayerAvatar[]>(
    "/player/avatars"
  );
}

/* ============================================================
   PUBLIC DASHBOARD
   ============================================================ */

export type PublicDashboard = {
  programme: {
    id: Id;
    name: string;
    target_xp: number;
    weekly_target_xp: number;
  } | null;

  group_xp: number;

  theme: {
    id: Id;
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    logo_url?: string | null;
    font_family?: string | null;
  } | null;

  phases: Array<{
    id: Id;
    name: string;
    description: string | null;
    colour: string;
    icon: string;
  }>;

  map: {
    id: Id;
    name: string;
    background_image: string | null;
    locations: Array<{
      id: Id;
      name: string;
      description: string | null;
      x: number;
      y: number;
      icon: string;
    }>;
  } | null;
};

export async function publicDashboard() {
  return api.get<PublicDashboard>(
    "/public/dashboard"
  );
}

/* ============================================================
   LEADERBOARD
   ============================================================ */

export type LeaderboardEntry = {
  rank?: number;
  gamertag: string;
  avatar: string;
  xp: number;
};

export async function leaderboard() {
  return api.get<LeaderboardEntry[]>(
    "/leaderboard"
  );
}

/* ============================================================
   CHALLENGES
   ============================================================ */

export type ChallengeState =
  | "scheduled"
  | "live"
  | "ended";

export type PlayerChallenge = {
  id: Id;
  phase_id: Id | null;
  title: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;

  participation_xp: number;
  elite_xp: number;
  winner_xp: number;
  group_xp: number;

  active: boolean;
  state?: ChallengeState;
};

export type ChallengeAttemptRequest = {
  score: number;
  attempt_id?: string;
  metadata?: Record<string, unknown>;
};

export type ChallengeAttemptResponse = {
  success: boolean;

  challenge: {
    id: Id;
    title: string;
  };

  attempt: {
    id: string;
    score: number;
  };

  achievement: {
    participation: boolean;
    elite: boolean;
    winner: boolean;
  };

  xp: {
    individual: number;
    group: number;
    participation: number;
    elite: number;
    winner: number;
  };

  player_total_xp: number;
};

export type ChallengeSummary = {
  attempts?: number;
  participants?: number;
  highest_score?: number | null;
  average_score?: number | null;
  [key: string]: unknown;
};

export type StaffChallenge = PlayerChallenge & {
  summary?: ChallengeSummary;
};

export type ChallengeRequest = {
  phase_id?: Id | null;
  title: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  participation_xp?: number;
  elite_xp?: number;
  winner_xp?: number;
  group_xp?: number;
  active?: boolean;
};

export async function getChallenges() {
  return api.get<PlayerChallenge[]>(
    "/challenges"
  );
}

export async function getChallenge(
  challengeId: Id
) {
  return api.get<PlayerChallenge>(
    `/challenges/${challengeId}`
  );
}

export async function submitChallengeAttempt(
  challengeId: Id,
  payload: ChallengeAttemptRequest
) {
  return api.post<ChallengeAttemptResponse>(
    `/challenges/${challengeId}/attempt`,
    payload
  );
}

export async function getStaffChallenges() {
  return api.get<StaffChallenge[]>(
    "/challenges/staff/list"
  );
}

export async function createChallenge(
  payload: ChallengeRequest
) {
  return api.post<PlayerChallenge>(
    "/challenges/staff",
    payload
  );
}

export async function updateChallenge(
  challengeId: Id,
  payload: ChallengeRequest
) {
  return api.put<PlayerChallenge>(
    `/challenges/staff/${challengeId}`,
    payload
  );
}

export async function enableChallenge(
  challengeId: Id
) {
  return api.post<{
    success: boolean;
    id: Id;
    active: boolean;
  }>(
    `/challenges/staff/${challengeId}/enable`
  );
}

export async function disableChallenge(
  challengeId: Id
) {
  return api.post<{
    success: boolean;
    id: Id;
    active: boolean;
  }>(
    `/challenges/staff/${challengeId}/disable`
  );
}

/* ============================================================
   CHALLENGE ATTEMPT REVIEW
   ============================================================ */

export type ChallengeAttemptStatus =
  | "created"
  | "submitted"
  | "verified"
  | "rejected";

export type StaffChallengeAttempt = {
  id: Id;

  attempt_reference: string;

  challenge_id: Id;
  challenge_title?: string | null;

  player_id: Id;
  player_name?: string | null;
  player_username?: string | null;

  score: number;

  status: ChallengeAttemptStatus;

  evidence_type?: string | null;
  evidence_payload?: string | null;
  evidence_hash?: string | null;

  rejection_reason?: string | null;

  verified?: boolean;
  verified_by?: Id | null;
  verified_at?: string | null;

  percentile?: number | null;
  elite?: boolean;
  winner?: boolean;

  participation_xp?: number;
  elite_xp?: number;
  winner_xp?: number;
  individual_xp?: number;
  group_xp?: number;

  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  [key: string]: unknown;
};

export type StaffChallengeAttemptListResponse =
  | StaffChallengeAttempt[]
  | {
      attempts: StaffChallengeAttempt[];
      [key: string]: unknown;
    };

export type ChallengeAttemptRejectRequest = {
  reason: string;
};

/**
 * Staff attempt queue.
 *
 * Phase 3 backend:
 * GET /challenges/staff/attempts
 *
 * Optional filters:
 * - status
 * - challenge_id
 */
export async function getStaffChallengeAttempts(
  params?: {
    status?: ChallengeAttemptStatus;
    challenge_id?: Id;
  },
) {
  const search = new URLSearchParams();

  if (params?.status) {
    search.set(
      "status",
      params.status,
    );
  }

  if (params?.challenge_id != null) {
    search.set(
      "challenge_id",
      String(params.challenge_id),
    );
  }

  const query =
    search.toString();

  return api.get<StaffChallengeAttemptListResponse>(
    `/challenges/staff/attempts${
      query
        ? `?${query}`
        : ""
    }`,
  );
}

/**
 * Staff attempt detail.
 *
 * Phase 3 backend:
 * GET /challenges/staff/attempts/{attempt_id}
 */
export async function getStaffChallengeAttempt(
  attemptId: Id,
) {
  return api.get<StaffChallengeAttempt>(
    `/challenges/staff/attempts/${attemptId}`,
  );
}

/**
 * Verify a submitted attempt.
 *
 * Phase 3 backend:
 * POST /challenges/staff/attempts/{attempt_id}/verify
 *
 * Verification is authoritative on the backend and may
 * award the configured challenge XP.
 */
export async function verifyChallengeAttempt(
  attemptId: Id,
) {
  return api.post(
    `/challenges/staff/attempts/${attemptId}/verify`,
  );
}

/**
 * Reject a submitted attempt.
 *
 * Phase 3 backend:
 * POST /challenges/staff/attempts/{attempt_id}/reject
 */
export async function rejectChallengeAttempt(
  attemptId: Id,
  payload: ChallengeAttemptRejectRequest,
) {
  return api.post(
    `/challenges/staff/attempts/${attemptId}/reject`,
    payload,
  );
};
/* ============================================================
   RESOURCES
   ============================================================ */

export type Resource = {
  id: Id;
  title: string;
  description: string | null;
  url: string | null;
  type: string | null;
  phase_id?: Id | null;
  active?: boolean;
};

export async function getResources() {
  return api.get<Resource[]>(
    "/resources"
  );
}

/* ============================================================
   JACKPOT / PROGRAMME MILESTONES
   ============================================================ */

export type ProgrammeMilestone = {
  id: Id;
  name: string;
  xp_threshold: number;
  reward_description: string | null;
  reward_value: number;
  reward_type: string;
  sort_order: number;
  active: boolean;
  achieved: boolean;
  awarded_at: string | null;
};

export type JackpotConfiguration = {
  programme: {
    id: Id;
    name: string;
    target_xp: number;
    weekly_target_xp: number;
    max_group_penalty_percent: number;
  };

  current_xp: number;
  progress_percent: number;
  remaining_xp: number;

  milestones: ProgrammeMilestone[];
};

export type ProgrammeMilestoneRequest = {
  name: string;
  xp_threshold: number;
  reward_description?: string | null;
  reward_value: number;
  reward_type: string;
  sort_order: number;
  active: boolean;
};

export async function getJackpot() {
  return api.get<JackpotConfiguration>(
    "/admin/jackpot"
  );
}

export async function createJackpotMilestone(
  data: ProgrammeMilestoneRequest
) {
  return api.post<{ success: boolean; id: Id }>(
    "/admin/jackpot/milestones",
    data
  );
}

export async function updateJackpotMilestone(
  id: Id,
  data: ProgrammeMilestoneRequest
) {
  return api.put<{ success: boolean; id: Id }>(
    `/admin/jackpot/milestones/${id}`,
    data
  );
}

export async function disableJackpotMilestone(
  id: Id
) {
  return api.delete<{
    success: boolean;
    id: Id;
    active: boolean;
  }>(
    `/admin/jackpot/milestones/${id}`
  );
}

/**
 * Generic authenticated API helper used by admin modules.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        detail = data.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
