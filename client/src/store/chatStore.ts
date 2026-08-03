import { create } from 'zustand';
import { ConversationItem, MessageItem, MessageReaction } from '../types/index.js';

interface ChatState {
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  messages: Record<string, MessageItem[]>;
  onlineUsers: Record<string, boolean>;
  typingUsers: Record<string, string[]>;
  replyingToMessage: MessageItem | null;
  mobileView: 'list' | 'chat';
  wallpaper: string;

  setConversations: (conversations: ConversationItem[]) => void;
  setActiveConversation: (conversation: ConversationItem | null) => void;
  setMessages: (conversationId: string, messages: MessageItem[]) => void;
  addMessage: (conversationId: string, message: MessageItem) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: 'SENT' | 'DELIVERED' | 'READ') => void;
  updateMessageReaction: (conversationId: string, messageId: string, reactions: MessageReaction[]) => void;
  setReplyingToMessage: (message: MessageItem | null) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setTypingUser: (conversationId: string, userName: string, isTyping: boolean) => void;
  setMobileView: (mobileView: 'list' | 'chat') => void;
  setWallpaper: (wallpaper: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  onlineUsers: {},
  typingUsers: {},
  replyingToMessage: null,
  mobileView: 'list',
  wallpaper: typeof window !== 'undefined' ? localStorage.getItem('afrin_chat_wallpaper') || 'midnight' : 'midnight',

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (activeConversation) => set({ activeConversation }),
  setMessages: (conversationId, messageList) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messageList },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const exists = existing.some((m) => m._id === message._id);
      const updatedMessages = exists
        ? existing.map((m) => (m._id === message._id ? message : m))
        : [...existing, message];

      // Update target conversation and re-sort to top of conversation list
      const targetConv = state.conversations.find((c) => c._id === conversationId);
      const otherConvs = state.conversations.filter((c) => c._id !== conversationId);

      const updatedTarget = targetConv
        ? {
            ...targetConv,
            lastMessageId: message,
            updatedAt: message.createdAt || new Date().toISOString(),
          }
        : null;

      const updatedConvs = updatedTarget
        ? [updatedTarget, ...otherConvs]
        : state.conversations;

      return {
        messages: { ...state.messages, [conversationId]: updatedMessages },
        conversations: updatedConvs,
      };
    }),

  updateMessageStatus: (conversationId, messageId, status) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const updated = existing.map((m) => (m._id === messageId ? { ...m, status } : m));
      return {
        messages: { ...state.messages, [conversationId]: updated },
      };
    }),

  updateMessageReaction: (conversationId, messageId, reactions) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const updated = existing.map((m) => (m._id === messageId ? { ...m, reactions } : m));
      return {
        messages: { ...state.messages, [conversationId]: updated },
      };
    }),

  setReplyingToMessage: (replyingToMessage) => set({ replyingToMessage }),

  setUserOnline: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),

  setTypingUser: (conversationId, userName, isTyping) =>
    set((state) => {
      const currentList = state.typingUsers[conversationId] || [];
      let updated: string[];
      if (isTyping) {
        updated = currentList.includes(userName) ? currentList : [...currentList, userName];
      } else {
        updated = currentList.filter((u) => u !== userName);
      }
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    }),

  setMobileView: (mobileView) => set({ mobileView }),
  setWallpaper: (wallpaper) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('afrin_chat_wallpaper', wallpaper);
    }
    set({ wallpaper });
  },
}));
