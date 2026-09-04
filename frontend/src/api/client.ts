import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";

/* ============================================================
   CONFIG
============================================================ */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

/* ============================================================
   AXIOS INSTANCE
============================================================ */

export const api: AxiosInstance =
  axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 15_000,
  });

/* ============================================================
   TYPES
============================================================ */

export type ID = number | string;

export type UserRole =
  | "admin"
  | "youth_worker"
  | "player";

export interface User {
  id: ID;
  username?: string;
  role?: UserRole | string;
  is_active?: boolean;
}

export interface AuthResponse {
  user?: User;
  access_token?: string;
  token_type?: string;
  message?: string;
}

/* ------------------------------------------------------------
   Programme
------------------------------------------------------------ */

export interface Programme {
  id: ID;
  name?: string;
  title?: string;
  description?: string;

  status?: string;

  start_date?: string;
  end_date?: string;

  current_phase_id?: ID;
  current_phase?: string;

  target_xp?: number;
  jackpot_target?: number;

  collective_xp?: number;
  total_xp?: number;
  group_xp?: number;
}

/* ------------------------------------------------------------
   Players
------------------------------------------------------------ */

export interface Player {
  id: ID;

  username?: string;
  gamertag?: string;

  avatar?: string;
  avatar_id?: ID;

  role?: string;

  status?: string;
  is_active?: boolean;

  xp?: number;
  points?: number;

  total_xp?: number;
  lifetime_xp?: number;
  individual_xp?: number;

  engagement_score?: number;

  last_activity?: string;
  last_seen?: string;

  level?: number;
  badge_count?: number;
}

/* ------------------------------------------------------------
   Challenges
------------------------------------------------------------ */

export interface Challenge {
  id: ID;

  name?: string;
  title?: string;
  description?: string;

  status?: string;

  starts_at?: string;
  ends_at?: string;

  xp_reward?: number;
  points?: number;

  participant_count?: number;
  participants?: number;

  max_attempts?: number;
}

/* ------------------------------------------------------------
   Themes
------------------------------------------------------------ */

export interface Theme {
  id: ID;

  name: string;

  primary: string;
  secondary: string;
  accent: string;

  background: string;
  surface: string;
  text: string;

  active?: boolean;
  is_active?: boolean;
}

/* ------------------------------------------------------------
   Phases
------------------------------------------------------------ */

export interface Phase {
  id: ID;

  name: string;

  description?: string;

  colour?: string;
  color?: string;

  icon?: string;

  active?: boolean;
  is_active?: boolean;

  start_date?: string;
  end_date?: string;
}

/* ------------------------------------------------------------
   Maps
------------------------------------------------------------ */

export interface MapDefinition {
  id: ID;

  name: string;

  description?: string;

  image_url?: string;
  background_url?: string;

  active?: boolean;
  is_active?: boolean;
}

export interface MapLocation {
  id: ID;

  map_id?: ID;

  name: string;

  description?: string;

  x?: number;
  y?: number;

  latitude?: number;
  longitude?: number;

  icon?: string;

  active?: boolean;
}

/* ------------------------------------------------------------
   Point rules
------------------------------------------------------------ */

export interface PointRule {
  id: ID;

  name: string;
  description?: string;

  amount: number;

  category?: string;

  active?: boolean;
  is_active?: boolean;

  applies_to?: string;
}

/* ------------------------------------------------------------
   Rewards
------------------------------------------------------------ */

export interface Reward {
  id: ID;

  name: string;
  description?: string;

  type?: string;

  value?: number;
  xp_cost?: number;

  available?: boolean;
  is_active?: boolean;
}

/* ------------------------------------------------------------
   Community awards
------------------------------------------------------------ */

export type CommunityAwardStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface CommunityAward {
  id: ID;

  player_id?: ID;
  group_id?: ID;

  player?: Player;

  category: string;
  description: string;

  submitted_by_name?: string;
  submitted_by_contact?: string;

  status?: CommunityAwardStatus;

  created_at?: string;
  reviewed_at?: string;
}

/* ------------------------------------------------------------
   Activity
------------------------------------------------------------ */

export interface Activity {
  id?: ID;

  type?: string;
  action?: string;

  message?: string;
  description?: string;

  username?: string;
  gamertag?: string;

  player_id?: ID;

  xp?: number;
  points?: number;

  created_at?: string;
  timestamp?: string;
}

/* ------------------------------------------------------------
   Resources
------------------------------------------------------------ */

export interface Resource {
  id: ID;

  title: string;

  description?: string;

  type?: string;

  url?: string;

  phase_id?: ID;

  active?: boolean;
  is_active?: boolean;
}

/* ------------------------------------------------------------
   Leaderboard
------------------------------------------------------------ */

export interface LeaderboardEntry {
  rank?: number;

  player_id?: ID;

  gamertag?: string;
  username?: string;

  avatar?: string;

  xp?: number;
  points?: number;
  total_xp?: number;
}

/* ------------------------------------------------------------
   Dashboard responses
------------------------------------------------------------ */

export interface AdminOverview {
  programme?: Programme;

  programs?: Programme[];

  players?: Player[];

  stats?: {
    total_xp?: number;
    collective_xp?: number;

    active_players?: number;
    total_players?: number;

    weekly_xp?: number;

    pending_awards?: number;

    active_challenges?: number;
  };

  activities?: Activity[];
  recent_activity?: Activity[];

  challenges?: Challenge[];
}

export interface PlayerDashboard {
  player?: Player;

  profile?: Player;

  xp?: number;
  total_xp?: number;
  lifetime_xp?: number;

  level?: number;

  badges?: unknown[];
  skill_trees?: unknown[];
  rewards?: unknown[];
  activities?: Activity[];

  challenges?: Challenge[];
}

/* ============================================================
   REQUEST TYPES
============================================================ */

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AwardXPPayload {
  player_id: number;
  amount: number;
  reason: string;
}

export interface CommunityAwardPayload {
  player_id?: number;
  group_id?: number;

  category: string;
  description: string;

  submitted_by_name: string;
  submitted_by_contact: string;
}

export interface ThemePayload {
  name: string;

  primary: string;
  secondary: string;
  accent: string;

  background: string;
  surface: string;
  text: string;
}

export interface PhasePayload {
  name: string;

  description?: string;

  colour?: string;
  icon?: string;
}

export interface MapPayload {
  name: string;

  description?: string;

  image_url?: string;
}

export interface MapLocationPayload {
  name: string;

  description?: string;

  x?: number;
  y?: number;

  latitude?: number;
  longitude?: number;

  icon?: string;
}

export interface PointRulePayload {
  name: string;

  description?: string;

  amount: number;

  category?: string;

  active?: boolean;
}

export interface RewardPayload {
  name: string;

  description?: string;

  type?: string;

  value?: number;

  xp_cost?: number;

  available?: boolean;
}

/* ============================================================
   ERROR HANDLING
============================================================ */

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
  errors?: string[];
}

export function getApiErrorMessage(
  error: unknown,
  fallback =
    "Something went wrong. Please try again.",
): string {
  if (
    error instanceof AxiosError
  ) {
    const data =
      error.response?.data as
        | ApiErrorResponse
        | undefined;

    if (
      Array.isArray(data?.errors) &&
      data.errors.length > 0
    ) {
      return data.errors.join(", ");
    }

    if (
      typeof data?.detail ===
      "string"
    ) {
      return data.detail;
    }

    if (
      typeof data?.message ===
      "string"
    ) {
      return data.message;
    }

    if (
      typeof data?.error ===
      "string"
    ) {
      return data.error;
    }

    if (
      error.response?.status === 401
    ) {
      return "Your session has expired. Please sign in again.";
    }

    if (
      error.response?.status === 403
    ) {
      return "You do not have permission to perform this action.";
    }

    if (
      error.response?.status === 404
    ) {
      return "The requested item could not be found.";
    }

    if (
      error.response?.status === 422
    ) {
      return "Some of the submitted information is invalid.";
    }

    if (
      error.response?.status &&
      error.response.status >= 500
    ) {
      return "The server encountered a problem. Please try again.";
    }

    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }

    if (
      error.message ===
      "Network Error"
    ) {
      return "Unable to connect to the platform. Check your connection and try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/* ============================================================
   OPTIONAL RESPONSE HELPERS
============================================================ */

function unwrap<T>(
  response: {
    data: T;
  },
): T {
  return response.data;
}

/* ============================================================
   AUTH
============================================================ */

export async function login(
  username: string,
  password: string,
) {
  return api.post<AuthResponse>(
    "/auth/login",
    {
      username,
      password,
    } satisfies LoginPayload,
  );
}

export async function logout() {
  return api.post("/auth/logout");
}

export async function me() {
  return api.get<User>("/auth/me");
}

/* ============================================================
   PLAYER
============================================================ */

export async function playerDashboard() {
  return api.get<PlayerDashboard>(
    "/player/dashboard",
  );
}

export async function playerAvatars() {
  return api.get(
    "/player/avatars",
  );
}

/* ============================================================
   PUBLIC
============================================================ */

export async function publicDashboard() {
  return api.get(
    "/public/dashboard",
  );
}

export async function leaderboard() {
  return api.get<LeaderboardEntry[]>(
    "/leaderboard",
  );
}

/* ============================================================
   ADMIN — OVERVIEW
============================================================ */

export async function adminOverview() {
  return api.get<AdminOverview>(
    "/admin/overview",
  );
}

export async function adminPlayers() {
  return api.get<Player[]>(
    "/admin/players",
  );
}

/* ============================================================
   ADMIN — PROGRAMME
============================================================ */

export async function getProgramme() {
  return api.get<Programme>(
    "/admin/programme",
  );
}

export async function updateProgramme(
  payload: Partial<Programme>,
) {
  return api.put<Programme>(
    "/admin/programme",
    payload,
  );
}

/* ============================================================
   ADMIN — THEMES
============================================================ */

export async function getThemes() {
  return api.get<Theme[]>(
    "/admin/themes",
  );
}

export async function createTheme(
  payload: ThemePayload,
) {
  return api.post<Theme>(
    "/admin/themes",
    payload,
  );
}

export async function updateTheme(
  id: ID,
  payload: Partial<ThemePayload>,
) {
  return api.put<Theme>(
    `/admin/themes/${id}`,
    payload,
  );
}

export async function activateTheme(
  id: ID,
) {
  return api.post(
    `/admin/themes/${id}/activate`,
  );
}

/* ============================================================
   ADMIN — MAPS
============================================================ */

export async function getMaps() {
  return api.get<MapDefinition[]>(
    "/admin/maps",
  );
}

export async function createMap(
  payload: MapPayload,
) {
  return api.post<MapDefinition>(
    "/admin/maps",
    payload,
  );
}

export async function updateMap(
  id: ID,
  payload: Partial<MapPayload>,
) {
  return api.put<MapDefinition>(
    `/admin/maps/${id}`,
    payload,
  );
}

export async function activateMap(
  id: ID,
) {
  return api.post(
    `/admin/maps/${id}/activate`,
  );
}

export async function getMapLocations(
  mapId: ID,
) {
  return api.get<MapLocation[]>(
    `/admin/maps/${mapId}/locations`,
  );
}

export async function createMapLocation(
  mapId: ID,
  payload: MapLocationPayload,
) {
  return api.post<MapLocation>(
    `/admin/maps/${mapId}/locations`,
    payload,
  );
}

export async function updateMapLocation(
  id: ID,
  payload: Partial<MapLocationPayload>,
) {
  return api.put<MapLocation>(
    `/admin/maps/locations/${id}`,
    payload,
  );
}

/* ============================================================
   ADMIN — PHASES
============================================================ */

export async function getPhases() {
  return api.get<Phase[]>(
    "/admin/phases",
  );
}

export async function createPhase(
  payload: PhasePayload,
) {
  return api.post<Phase>(
    "/admin/phases",
    payload,
  );
}

/* ============================================================
   ADMIN — POINT RULES
============================================================ */

export async function getPointRules() {
  return api.get<PointRule[]>(
    "/admin/point-rules",
  );
}

export async function createPointRule(
  payload: PointRulePayload,
) {
  return api.post<PointRule>(
    "/admin/point-rules",
    payload,
  );
}

export async function updatePointRule(
  id: ID,
  payload: Partial<PointRulePayload>,
) {
  return api.put<PointRule>(
    `/admin/point-rules/${id}`,
    payload,
  );
}

/* ============================================================
   ADMIN — REWARDS
============================================================ */

export async function getRewards() {
  return api.get<Reward[]>(
    "/admin/rewards",
  );
}

export async function createReward(
  payload: RewardPayload,
) {
  return api.post<Reward>(
    "/admin/rewards",
    payload,
  );
}

/* ============================================================
   ADMIN — XP
============================================================ */

export async function awardXP(
  playerId: number,
  amount: number,
  reason: string,
) {
  return api.post(
    "/admin/xp/award",
    {
      player_id: playerId,
      amount,
      reason,
    } satisfies AwardXPPayload,
  );
}

/* ============================================================
   ATTENDANCE
============================================================ */

export async function startAttendance() {
  return api.post(
    "/attendance/start",
  );
}

export async function checkIn(
  code: string,
) {
  return api.post(
    "/attendance/check-in",
    {
      code,
    },
  );
}

/* ============================================================
   COMMUNITY AWARDS
============================================================ */

export async function createCommunityAward(
  payload: CommunityAwardPayload,
) {
  return api.post<CommunityAward>(
    "/community/awards",
    payload,
  );
}

export async function adminCommunityAwards() {
  return api.get<CommunityAward[]>(
    "/admin/community-awards",
  );
}

export async function reviewCommunityAward(
  id: ID,
  status:
    | "approved"
    | "rejected",
) {
  return api.post(
    `/admin/community-awards/${id}/review`,
    {
      status,
    },
  );
}

/* ============================================================
   RESOURCES
============================================================ */

export async function getResources() {
  return api.get<Resource[]>(
    "/resources",
  );
}

/* ============================================================
   CHALLENGES
============================================================ */

export async function getChallenges() {
  return api.get<Challenge[]>(
    "/challenges",
  );
}

/* ============================================================
   GENERIC REQUEST HELPERS
============================================================ */

/**
 * Use this only for genuinely new endpoints which have not
 * yet earned a dedicated typed API function.
 *
 * Keeping this escape hatch here prevents components from
 * importing axios directly.
 */
export async function apiRequest<
  T = unknown,
>(
  config: AxiosRequestConfig,
) {
  return api.request<T>(config);
}

/**
 * Convenience wrapper when a component only needs the
 * response payload.
 */
export async function getData<
  T = unknown,
>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response =
    await api.get<T>(
      url,
      config,
    );

  return unwrap(response);
}

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default api;
