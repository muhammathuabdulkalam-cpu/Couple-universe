import { UserRole, UserStatus } from './index';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLoginAt?: string;
}

export interface PartnerOverview {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface PrimaryCoupleData {
  coupleName: string;
  relationshipType: string;
  startDate: string;
  daysTogether: number;
  status: string;
  photo: string;
  partners: PartnerOverview[];
  stats: {
    totalMemories: number;
    totalAlbums: number;
    totalStories: number;
    totalSharedSongs: number;
  };
}

export interface SystemHealthData {
  database: { status: string; latencyMs?: number };
  api: { status: string };
  server: { status: string; uptimeSeconds: number };
  memory: { heapUsedMb: number; heapTotalMb: number; formatted: string };
  environment: string;
  appVersion: string;
  storageNotice: string;
}

export interface PlatformStatsData {
  totalUsers: number;
  activeUsers: number;
  totalRelationships: number;
  totalMemories: number;
  totalAlbums: number;
  totalStories: number;
  totalSharedSongs: number;
}

export interface AdminDashboardSummary {
  platformStats: PlatformStatsData;
  primaryCouple: PrimaryCoupleData;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
    createdAt: string;
  }>;
  systemHealth: SystemHealthData;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  bio?: string;
  birthday?: string;
  relationshipName: string;
  relationshipType: string;
  partnerName: string;
  isOnline: boolean;
  lastSeen?: string;
  lastLoginAt?: string;
  createdAt: string;
  storageNotice: string;
}

export interface EnabledFeatureItem {
  name: string;
  enabled: boolean;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  bio?: string;
  birthday?: string;
  relationshipName: string;
  relationshipType: string;
  partnerName: string;
  startDate: string;
  storageUsed: string;
  isOnline: boolean;
  lastActiveAt: string;
  lastLoginAt: string;
  accountStatus: UserStatus;
  loginMethod: string;
  createdBy: string;
  enabledFeatures: EnabledFeatureItem[];
}

export interface AdminRelationshipItem {
  id: string;
  name: string;
  type: string;
  coverImage: string;
  startDate: string;
  daysTogether: number;
  status: string;
  members: Array<{ id: string; name: string; role: string; avatar?: string }>;
  stats: {
    totalMemories: number;
    totalAlbums: number;
    totalStories: number;
    totalSharedSongs: number;
  };
  createdDate: string;
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- Phase 2 Form & Action Types ---

export interface CreateUserFormData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  password: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  role: UserRole;
  status?: UserStatus;
  bio?: string;
  avatar?: string;
  relationshipId?: string;
}

export interface UpdateUserFormData {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  bio?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  relationshipId?: string;
}

export interface CreateRelationshipFormData {
  name: string;
  type: string;
  coverImage?: string;
  startDate?: string;
  description?: string;
  members?: Array<{ userId: string; role?: string }>;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface UpdateRelationshipFormData {
  name?: string;
  type?: string;
  coverImage?: string;
  startDate?: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface AdminInviteToken {
  _id: string;
  code: string;
  relationshipId?: string;
  relationshipType?: string;
  relationshipName?: string;
  targetRole: string;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
  status: 'UNUSED' | 'USED' | 'EXPIRED' | 'REVOKED';
  isRevoked: boolean;
  createdAt: string;
}

export interface MemberManagementPayload {
  userId: string;
  role?: string;
}

export interface InviteValidationResult {
  code: string;
  targetRole: string;
  relationshipId: string;
  relationshipType: string;
  relationshipName: string;
  expiresAt: string;
  status: string;
}

