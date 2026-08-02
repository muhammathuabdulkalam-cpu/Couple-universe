import { NavigateFunction } from 'react-router-dom';
import { useChatStore } from '../store/chatStore.js';
import { NotificationItem } from '../types/index.js';

/**
 * Centralized Notification Deep Linking Navigation Handler
 * Marks notification as read and navigates directly to the related content.
 */
export const handleNotificationClick = async (
  notification: NotificationItem,
  navigate: NavigateFunction,
  onMarkRead?: (id: string) => void
) => {
  if (!notification.isRead && onMarkRead) {
    onMarkRead(notification._id);
  }

  const targetType = (notification.targetType || notification.refModel || '').toUpperCase();
  const targetId = notification.targetId || notification.referenceId;
  const notifType = notification.type;

  // 1. Stories & Story Replies/Reactions (Instagram style: opens story & likes tray)
  if (
    notifType === 'STORY_REACTION' ||
    notifType === 'STORY_VIEW' ||
    notifType === 'STORY_REPLY' ||
    targetType === 'STORY'
  ) {
    navigate('/stories', { state: { highlightStoryId: targetId, openActivitySheet: true } });
    return;
  }

  // 2. Chat & Direct Messages
  if (notifType === 'MESSAGE' || targetType === 'CONVERSATION' || targetType === 'MESSAGE') {
    if (targetId) {
      useChatStore.getState().setMobileView('chat');
    }
    navigate('/chat', { state: { conversationId: targetId } });
    return;
  }

  // 3. Follows & User Profiles
  if (notifType === 'FOLLOW' || targetType === 'USER' || targetType === 'FOLLOW') {
    navigate('/profile', { state: { userId: targetId } });
    return;
  }

  // 4. Posts, Feed Activities, Comments & Mentions -> Open exact post on Home Feed UI with comments open
  if (
    notifType === 'COMMENT' ||
    notifType === 'COMMENT_REPLY' ||
    notifType === 'MENTION' ||
    targetType === 'POST' ||
    targetType === 'ACTIVITY' ||
    targetType === 'COMMENT'
  ) {
    navigate('/dashboard', { state: { highlightId: targetId, openComments: true } });
    return;
  }

  // 5. Timeline Memories & Reactions
  if (notifType === 'MEMORY_REACTION' || targetType === 'MEMORY' || targetType === 'TIMELINE') {
    navigate('/timeline', { state: { highlightMemoryId: targetId } });
    return;
  }

  // 6. Calendar Events, Birthdays & Anniversaries
  if (
    notifType === 'BIRTHDAY' ||
    notifType === 'ANNIVERSARY' ||
    notifType === 'CALENDAR_REMINDER' ||
    targetType === 'BIRTHDAY' ||
    targetType === 'ANNIVERSARY' ||
    targetType === 'CALENDAR_EVENT' ||
    targetType === 'EVENT'
  ) {
    navigate('/calendar', { state: { highlightEventId: targetId } });
    return;
  }

  // 7. Post Likes / Reactions -> Open exact post on Home Feed UI with likes overview
  if (notifType === 'REACTION') {
    navigate('/dashboard', { state: { highlightId: targetId, openLikes: true } });
    return;
  }

  // Default Fallback
  navigate('/dashboard');
};
