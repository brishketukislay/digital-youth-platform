export const DEFAULT_TARGET_XP = 1_500_000;

export const MYSTERY_THRESHOLDS = [
  {
    xp: 15_000,
    label: "Early Hook",
  },
  {
    xp: 45_000,
    label: "Midway",
  },
  {
    xp: 85_000,
    label: "Legendary",
  },
] as const;

export const AVATAR_MAP: Record<
  string,
  string
> = {
  "avatar-1": "🦊",
  "avatar-2": "🐼",
  "avatar-3": "🐸",
  "avatar-4": "🐯",
  "avatar-5": "🐺",
  "avatar-6": "🤖",
  "avatar-7": "👾",
  "avatar-8": "🐙",
  "avatar-9": "🦉",
  "avatar-10": "🐻",
  "avatar-11": "🐨",
  "avatar-12": "🦁",
};

export const DEFAULT_AVATAR = "⭐";