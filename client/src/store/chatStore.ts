import { create } from 'zustand';
import { ConversationItem, MessageItem } from '../types/index.js';

interface ChatState {
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  messages: Record<string, MessageItem[]>; // conversationId -> messages array
  onlineUsers: Set<string>; // Set of userIds who are currently online
  typingUsers: Record<string, string[]>; // conversationId -> array of typing user names
  unreadCounts: Record<string, number>; // conversationId -> unread count
  wallpaper: string; // Active chat wallpaper theme
  mobileView: 'list' | 'chat'; // Mobile responsive active view panel
  replyingToMessage: MessageItem | null; // Message being replied to

  setConversations: (conversations: ConversationItem[]) => void;
  setActiveConversation: (conversation: ConversationItem | null) => void;
  setMessages: (conversationId: string, messages: MessageItem[]) => void;
  addMessage: (conversationId: string, message: MessageItem) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: MessageItem['status']) => void;
  updateMessageReaction: (conversationId: string, messageId: string, reactions: MessageItem['reactions']) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setTypingUser: (conversationId: string, userName: string, isTyping: boolean) => void;
  setWallpaper: (wallpaper: string) => void;
  setMobileView: (view: 'list' | 'chat') => void;
  setReplyingToMessage: (message: MessageItem | null) => void;
  clearActiveConversation: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  onlineUsers: new Set(),
  typingUsers: {},
  unreadCounts: {},
  wallpaper: 'midnight',
  mobileView: 'list',
  replyingToMessage: null,

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (activeConversation) =>
    set({
      activeConversation,
      mobileView: activeConversation ? 'chat' : 'list',
    }),

  setMessages: (conversationId, messagesList) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId.toString()]: messagesList },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const targetIdStr = conversationId.toString();
      const existing = state.messages[targetIdStr] || [];
      const exists = existing.some((m) => m._id?.toString() === message._id?.toString());
      const updatedMessages = exists
        ? existing.map((m) => (m._id?.toString() === message._id?.toString() ? message : m))
        : [...existing, message];

      // Update target conversation in conversations list and bump to top (index 0)
      const targetConv = state.conversations.find((c) => c._id?.toString() === targetIdStr);
      const otherConvs = state.conversations.filter((c) => c._id?.toString() !== targetIdStr);

      const updatedTarget = targetConv
        ? {
            ...targetConv,
            lastMessageId: message,
            updatedAt: message.createdAt || new Date().toISOString(),
          }
        : {
            _id: targetIdStr,
            type: 'PRIVATE',
            participants: message.sender ? [message.sender] : [],
            lastMessageId: message,
            updatedAt: message.createdAt || new Date().toISOString(),
            createdAt: message.createdAt || new Date().toISOString(),
          };

      const updatedConvs = [updatedTarget as any, ...otherConvs];

      return {
        messages: { ...state.messages, [targetIdStr]: updatedMessages },
        conversations: updatedConvs,
      };
    }),

  updateMessageStatus: (conversationId, messageId, status) =>
    set((state) => {
      const targetIdStr = conversationId.toString();
      const existing = state.messages[targetIdStr] || [];
      const updated = existing.map((m) =>
        m._id?.toString() === messageId.toString() ? { ...m, status } : m
      );
      return {
        messages: { ...state.messages, [targetIdStr]: updated },
      };
    }),

  updateMessageReaction: (conversationId, messageId, reactions) =>
    set((state) => {
      const targetIdStr = conversationId.toString();
      const existing = state.messages[targetIdStr] || [];
      const updated = existing.map((m) =>
        m._id?.toString() === messageId.toString() ? { ...m, reactions } : m
      );
      return {
        messages: { ...state.messages, [targetIdStr]: updated },
      };
    }),

  setUserOnline: (userId, isOnline) =>
    set((state) => {
      const newOnline = new Set(state.onlineUsers);
      if (isOnline) {
        newOnline.add(userId.toString());
      } else {
        newOnline.delete(userId.toString());
      }
      return { onlineUsers: newOnline };
    }),

  setTypingUser: (conversationId, userName, isTyping) =>
    set((state) => {
      const targetIdStr = conversationId.toString();
      const currentTyping = state.typingUsers[targetIdStr] || [];
      let updatedTyping: string[];

      if (isTyping) {
        updatedTyping = Array.from(new Set([...currentTyping, userName]));
      } else {
        updatedTyping = currentTyping.filter((name) => name !== userName);
      }

      return {
        typingUsers: { ...state.typingUsers, [targetIdStr]: updatedTyping },
      };
    }),

  setWallpaper: (wallpaper) => set({ wallpaper }),

  setMobileView: (mobileView) => set({ mobileView }),

  setReplyingToMessage: (replyingToMessage) => set({ replyingToMessage }),

  clearActiveConversation: () => set({ activeConversation: null, mobileView: 'list' }),
}));
