import {
  Activity,
  Baby,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Home,
  Image,
  KeyRound,
  Lock,
  MessageSquare,
  Music,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { UserRole } from '../types/index.js';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: any;
  section: 'main' | 'memories' | 'life' | 'admin';
  allowedRoles: UserRole[];
  badge?: string;
  isImplemented: boolean;
}

// Alias for backwards compatibility
export type NavigationItem = NavItem;

export const NAVIGATION_CONFIG: NavItem[] = [
  // -------------------------------------------------------
  // MAIN Section
  // -------------------------------------------------------
  {
    key: 'dashboard',
    label: 'Home',
    path: '/dashboard',
    icon: Home,
    section: 'main',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    isImplemented: true,
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
    section: 'main',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    badge: 'Module 8',
    isImplemented: true,
  },

  // -------------------------------------------------------
  // MEMORIES & VAULT Section
  // -------------------------------------------------------
  {
    key: 'gallery',
    label: '3D Gallery',
    path: '/gallery',
    icon: Image,
    section: 'memories',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    isImplemented: true,
  },
  {
    key: 'timeline',
    label: 'Timeline',
    path: '/timeline',
    icon: Clock,
    section: 'memories',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    isImplemented: true,
  },
  {
    key: 'capsule',
    label: 'Memory Capsule',
    path: '/capsule',
    icon: Lock,
    section: 'memories',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    badge: 'New',
    isImplemented: false,
  },

  // -------------------------------------------------------
  // LIFE & SOCIAL Section
  // -------------------------------------------------------
  {
    key: 'chat',
    label: 'Chat',
    path: '/chat',
    icon: MessageSquare,
    section: 'life',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    isImplemented: true,
  },
  {
    key: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: Calendar,
    section: 'life',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    isImplemented: true,
  },
  {
    key: 'diary',
    label: 'Shared Diary',
    path: '/diary',
    icon: BookOpen,
    section: 'life',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    isImplemented: false,
  },
  {
    key: 'bucket-list',
    label: 'Bucket List',
    path: '/bucket-list',
    icon: CheckSquare,
    section: 'life',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    isImplemented: false,
  },
  {
    key: 'shared-music',
    label: 'Shared Music',
    path: '/shared-music',
    icon: Music,
    section: 'life',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER', 'INVITED_USER'],
    isImplemented: false,
  },

  // -------------------------------------------------------
  // ADMINISTRATION Section (SUPER_OWNER Only)
  // -------------------------------------------------------
  {
    key: 'admin-users',
    label: 'User Management',
    path: '/admin',
    icon: ShieldCheck,
    section: 'admin',
    allowedRoles: ['SUPER_OWNER'],
    isImplemented: true,
  },
  {
    key: 'session-manager',
    label: 'Sessions & Security',
    path: '/session-manager',
    icon: KeyRound,
    section: 'admin',
    allowedRoles: ['SUPER_OWNER'],
    isImplemented: true,
  },
  {
    key: 'developer-dashboard',
    label: 'System Health',
    path: '/developer-dashboard',
    icon: Activity,
    section: 'admin',
    allowedRoles: ['SUPER_OWNER'],
    badge: 'Admin',
    isImplemented: true,
  },
  {
    key: 'baby',
    label: 'Baby Journey',
    path: '/baby-journey',
    icon: Baby,
    section: 'admin',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER'],
    badge: 'Module 12',
    isImplemented: false,
  },
  {
    key: 'family',
    label: 'Family Circle',
    path: '/family-circle',
    icon: Users,
    section: 'admin',
    allowedRoles: ['SUPER_OWNER', 'CO_OWNER'],
    badge: 'Module 13',
    isImplemented: false,
  },
];
