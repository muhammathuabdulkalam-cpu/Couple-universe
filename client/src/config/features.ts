export const FEATURES = {
  GALLERY: 'GALLERY',
  TIMELINE: 'TIMELINE',
  CALENDAR: 'CALENDAR',
  STORIES: 'STORIES',
  CHAT: 'CHAT',
  MUSIC: 'MUSIC',
  LISTEN_TOGETHER: 'LISTEN_TOGETHER',
  HEALTH: 'HEALTH',
  GAMES: 'GAMES',
  BUDGET: 'BUDGET',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

export interface FeatureMetadata {
  key: FeatureKey;
  label: string;
  description: string;
  iconName: string;
  defaultEnabled: boolean;
}

export const ALL_FEATURES_CONFIG: FeatureMetadata[] = [
  { key: FEATURES.GALLERY, label: 'Memory Vault & Gallery', description: 'Shared photos, albums, and video vault', iconName: 'Image', defaultEnabled: true },
  { key: FEATURES.TIMELINE, label: 'Love Story Timeline', description: 'Milestones, key dates, and anniversary memory lane', iconName: 'Clock', defaultEnabled: true },
  { key: FEATURES.CALENDAR, label: 'Shared Calendar & Events', description: 'Couples calendar, reminders, and date planning', iconName: 'Calendar', defaultEnabled: true },
  { key: FEATURES.STORIES, label: 'Shared Stories', description: 'Disappearing 24h photo & video highlights', iconName: 'Sparkles', defaultEnabled: true },
  { key: FEATURES.CHAT, label: 'Private Messaging', description: 'End-to-end private messaging & voice notes', iconName: 'MessageSquare', defaultEnabled: true },
  { key: FEATURES.MUSIC, label: 'Shared Jukebox & Music', description: 'Shared Spotify playlists, uploads, and dedications', iconName: 'Music', defaultEnabled: true },
  { key: FEATURES.LISTEN_TOGETHER, label: 'Listen Together Sync', description: 'Real-time simultaneous music listening', iconName: 'Radio', defaultEnabled: true },
  { key: FEATURES.HEALTH, label: 'Health & Period Tracker', description: 'Cycle predictions, mood tracking, and wellness', iconName: 'Activity', defaultEnabled: false },
  { key: FEATURES.GAMES, label: 'Couple Mini Games', description: 'Quizzes, trivia, and truth-or-dare', iconName: 'Gamepad2', defaultEnabled: false },
  { key: FEATURES.BUDGET, label: 'Shared Expenses & Savings', description: 'Budget tracking and savings goals', iconName: 'Wallet', defaultEnabled: false },
];
