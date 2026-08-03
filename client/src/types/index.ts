// -------------------------------------------------------
// Auth & User Types
// -------------------------------------------------------
export type UserRole = 'SUPER_OWNER' | 'CO_OWNER' | 'INVITED_USER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  bio?: string;
  birthday?: string;
  relationshipStartDate?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface SystemAuthStatus {
  hasOwner: boolean;
  ownerEmail?: string;
  totalUsers: number;
  systemLocked: boolean;
  isInitialSetupOpen: boolean;
}

export interface SessionItem {
  _id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface InviteItem {
  _id: string;
  code: string;
  targetRole: UserRole;
  email?: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
}

// -------------------------------------------------------
// UI / Toast Types
// -------------------------------------------------------
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

// -------------------------------------------------------
// Health Dashboard
// -------------------------------------------------------
export interface HealthStatus {
  status: string;
  timestamp: string;
  database: {
    status: string;
    name?: string;
    responseTime?: number;
  };
  app: {
    name: string;
    version: string;
    environment: string;
    uptimeSeconds: number;
  };
  system: {
    nodeVersion: string;
    platform: string;
    memoryUsage: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
  };
  relationshipTimeline?: {
    togetherness: {
      days: number;
      hours: number;
      minutes: number;
    };
  };
}

// -------------------------------------------------------
// Media & Gallery Types
// -------------------------------------------------------
export type MediaVisibility = 'PRIVATE' | 'COUPLE' | 'FAMILY' | 'FRIENDS' | 'PUBLIC';
export type MediaOrientation = 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE';
export type AlbumType =
  | 'DEFAULT'
  | 'FAVORITES'
  | 'TRAVEL'
  | 'MARRIAGE'
  | 'BABY'
  | 'FAMILY'
  | 'CUSTOM'
  | 'ARCHIVE';

export interface MediaItem {
  _id: string;
  owner: string;
  createdBy: { _id: string; name: string; email: string; avatar?: string };
  album?: { _id: string; name: string; albumType: AlbumType };
  title: string;
  description?: string;
  caption?: string;
  tags: string[];
  peopleTagged: string[];
  location?: { name?: string; lat?: number; lng?: number };
  visibility: MediaVisibility;
  takenAt?: string;
  memoryDate: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  blurHash?: string;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: MediaOrientation;
  dominantColor?: string;
  duration?: number;
  mimeType: string;
  fileSize: number;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumItem {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  owner: string;
  parentAlbum?: string;
  albumType: AlbumType;
  visibility: MediaVisibility;
  mediaCount: number;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------
// Timeline Types
// -------------------------------------------------------
export type EventType =
  | 'FIRST_CONVERSATION'
  | 'FIRST_CALL'
  | 'FIRST_MEETING'
  | 'FIRST_PHOTO'
  | 'DATE'
  | 'TRIP'
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'CELEBRATION'
  | 'ACHIEVEMENT'
  | 'FAMILY_EVENT'
  | 'MARRIAGE'
  | 'BABY'
  | 'TRAVEL'
  | 'CUSTOM';

export type ChapterType =
  | 'LOVE'
  | 'ENGAGEMENT'
  | 'MARRIAGE'
  | 'HONEYMOON'
  | 'TRAVEL'
  | 'FAMILY'
  | 'BABY'
  | 'CAREER'
  | 'HOME'
  | 'CUSTOM';

export type WeatherType = 'SUNNY' | 'RAINY' | 'CLOUDY' | 'SNOW' | 'WINDY';
export type MemoryMood =
  | 'HAPPY'
  | 'ROMANTIC'
  | 'EXCITED'
  | 'PEACEFUL'
  | 'GRATEFUL'
  | 'NOSTALGIC'
  | 'MEMORABLE';
export type EventImportance = 'NORMAL' | 'IMPORTANT' | 'MILESTONE';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface TimelineEvent {
  _id: string;
  owner: string;
  title: string;
  content?: string;
  shortDescription?: string;
  eventDate: string;
  eventType: EventType;
  chapter: ChapterType;
  coverMediaId?: MediaItem;
  mediaIds: MediaItem[];
  location?: { name?: string; lat?: number; lng?: number };
  weather?: WeatherType;
  mood: MemoryMood;
  emoji: string;
  importance: EventImportance;
  status: EventStatus;
  tags: string[];
  people: string[];
  visibility: MediaVisibility;
  sortOrder: number;
  isFavorite: boolean;
  createdBy: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------
// Calendar Types
// -------------------------------------------------------
export type CalendarEventType =
  | 'ANNIVERSARY'
  | 'BIRTHDAY'
  | 'FIRST_CHAT'
  | 'FIRST_CALL'
  | 'FIRST_MEETING'
  | 'DATE'
  | 'TRIP'
  | 'VACATION'
  | 'SHOPPING'
  | 'MOVIE'
  | 'DINNER'
  | 'WORK'
  | 'FAMILY'
  | 'MARRIAGE'
  | 'ENGAGEMENT'
  | 'BABY'
  | 'DOCTOR'
  | 'REMINDER'
  | 'CUSTOM';

export type RepeatRule = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type EventPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type CalendarEventStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CalendarEvent {
  _id: string;
  owner: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  timezone: string;
  location?: { name?: string; lat?: number; lng?: number };
  visibility: MediaVisibility;
  priority: EventPriority;
  status: CalendarEventStatus;
  color: string;
  icon: string;
  coverMediaId?: MediaItem;
  timelineEventId?: TimelineEvent;
  participants: { _id: string; name: string; email: string; avatar?: string }[];
  notifications: { triggerTime: string; offsetMinutes: number; channel: string }[];
  repeatRule: RepeatRule;
  isCompleted: boolean;
  isCancelled: boolean;
  createdBy: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------
// Chat & Conversation Types
// -------------------------------------------------------
export type ConversationType = 'PRIVATE' | 'GROUP' | 'RELATIONSHIP';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE' | 'GIF' | 'FILE';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface ConversationItem {
  _id: string;
  type: ConversationType;
  participants: { _id: string; id?: string; name: string; email: string; avatar?: string; role: UserRole }[];
  createdBy: string;
  groupInfo?: { name?: string; avatarMediaId?: MediaItem; description?: string };
  lastMessageId?: MessageItem;
  relationshipId?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface MessageItem {
  _id: string;
  conversationId: string;
  sender: { _id: string; id?: string; name: string; email: string; avatar?: string };
  type: MessageType;
  content?: string;
  mediaId?: MediaItem;
  replyToMessageId?: { _id: string; content?: string; sender: { name: string }; type: MessageType };
  forwardedFromMessageId?: string;
  reactions: MessageReaction[];
  status: MessageStatus;
  readBy: { userId: string; readAt: string }[];
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------
// Module 8 – Relationship Profile & Shared Life Types
// -------------------------------------------------------
export interface DiaryItem {
  _id: string;
  title: string;
  content: string;
  mediaIds: MediaItem[];
  mood: string;
  date: string;
  visibility: string;
  createdBy: { name: string; email: string; avatar?: string };
  createdAt: string;
}

export interface BucketItem {
  _id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  completedDate?: string;
  mediaId?: MediaItem;
  createdBy: { name: string; email: string };
  createdAt: string;
}

export interface WishlistItem {
  _id: string;
  name: string;
  description?: string;
  imageMediaId?: MediaItem;
  price?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'WISHED' | 'PURCHASED';
  createdBy: { name: string; email: string };
  createdAt: string;
}

export interface GoalItem {
  _id: string;
  title: string;
  description?: string;
  progress: number;
  targetDate?: string;
  status: 'ACTIVE' | 'ACHIEVED' | 'PAUSED';
  createdAt: string;
}

export interface MoodEntryItem {
  _id: string;
  userId: { name: string; avatar?: string };
  mood: 'HAPPY' | 'LOVED' | 'SAD' | 'EXCITED' | 'ANGRY' | 'TIRED';
  note?: string;
  date: string;
}

export interface NoteItem {
  _id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdBy: { name: string; email: string };
  updatedAt: string;
}

export interface MemoryCapsuleItem {
  _id: string;
  title: string;
  unlockDate: string;
  mediaIds: MediaItem[];
  message?: string;
  status: 'LOCKED' | 'UNLOCKED';
  createdBy: { name: string; email: string };
  createdAt: string;
}

export interface CountdownItem {
  _id: string;
  title: string;
  targetDate: string;
  type: 'ANNIVERSARY' | 'BIRTHDAY' | 'TRIP' | 'GOAL' | 'CUSTOM';
  createdAt: string;
}

// -------------------------------------------------------
// Generic API Response Envelope
// -------------------------------------------------------
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  errors?: any;
}

// -------------------------------------------------------
// Module 9 — Social Relationship Network Types
// -------------------------------------------------------

export type FollowStatus = 'REQUESTED' | 'ACCEPTED' | 'BLOCKED';

export interface FollowItem {
  _id: string;
  follower: { _id: string; name: string; email: string; avatar?: string };
  following: { _id: string; name: string; email: string; avatar?: string };
  status: FollowStatus;
  createdAt: string;
}

export type StoryVisibility = 'PUBLIC' | 'FRIENDS' | 'PARTNER';

export interface StoryReaction {
  userId: { _id: string; name: string; avatar?: string } | string;
  emoji: string;
  reactedAt: string;
}

export interface StoryItem {
  _id: string;
  userId: { _id: string; name: string; email: string; avatar?: string };
  mediaId: MediaItem;
  caption?: string;
  visibility: StoryVisibility;
  expiresAt: string;
  viewedBy: string[];
  views?: Array<{ userId: { _id: string; name: string; avatar?: string } | string; viewedAt?: string }>;
  reactions: StoryReaction[];
  isDeleted: boolean;
  createdAt: string;
}

export type ReactionTargetType = 'MEMORY' | 'STORY' | 'COMMENT' | 'ACTIVITY';
export type ReactionEmoji = '❤️' | '😂' | '🔥' | '😍' | '👍' | '😢';

export interface ReactionItem {
  _id: string;
  userId: { _id: string; name: string; avatar?: string };
  targetId: string;
  targetType: ReactionTargetType;
  emoji: ReactionEmoji | string;
  createdAt: string;
}

export type CommentTargetType = 'MEMORY' | 'STORY' | 'ACTIVITY';

export interface CommentItem {
  _id: string;
  userId: { _id: string; name: string; email: string; avatar?: string };
  targetType: CommentTargetType;
  targetId: string;
  content: string;
  parentCommentId?: string;
  likedBy: string[];
  isDeleted: boolean;
  replies?: CommentItem[];
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'MEMORY_CREATED'
  | 'STORY_CREATED'
  | 'GOAL_COMPLETED'
  | 'ANNIVERSARY'
  | 'CALENDAR_EVENT'
  | 'PROFILE_UPDATED'
  | 'RELATIONSHIP_MILESTONE'
  | 'BUCKET_COMPLETED';

export interface ActivityItem {
  _id: string;
  userId: { _id: string; name: string; email: string; avatar?: string };
  type: ActivityType;
  referenceId?: string;
  refModel?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  isPublic: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'FOLLOW'
  | 'REACTION'
  | 'COMMENT'
  | 'COMMENT_REPLY'
  | 'STORY_REACTION'
  | 'STORY_VIEW'
  | 'STORY_REPLY'
  | 'MEMORY_REACTION'
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'CALENDAR_REMINDER'
  | 'MESSAGE'
  | 'MENTION'
  | 'SYSTEM';

export interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: { _id: string; name: string; avatar?: string; role?: string };
  type: NotificationType;
  message: string;
  targetType?: string;
  targetId?: string;
  referenceId?: string;
  refModel?: string;
  isRead: boolean;
  createdAt: string;
}

export type ReportTargetType = 'USER' | 'MEMORY' | 'COMMENT' | 'STORY';
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'OTHER';
export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED';

export interface ReportItem {
  _id: string;
  reportedBy: { _id: string; name: string; email: string; avatar?: string };
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface BlockItem {
  _id: string;
  blocker: string;
  blocked: string;
  createdAt: string;
}

