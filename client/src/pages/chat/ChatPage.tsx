import React, { useEffect } from 'react';
import { socketClient } from '../../api/socketClient.js';
import { ChatLayout } from '../../components/chat/ChatLayout.js';
import { MediaViewerModal } from '../../components/media/MediaViewerModal.js';
import { FloatingCoupleMusicWidget } from '../../components/chat/FloatingCoupleMusicWidget.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';

export const ChatPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const {
    addMessage,
    updateMessageStatus,
    updateMessageReaction,
    setUserOnline,
    setTypingUser,
    removeConversation,
  } = useChatStore();

  useEffect(() => {
    if (!accessToken) return;

    const socket = socketClient.connect(accessToken);

    // Socket Event Listeners
    socket.on('receive_message', (message) => {
      if (message && message.conversationId) {
        const convId = typeof message.conversationId === 'object'
          ? (message.conversationId._id || message.conversationId.id || message.conversationId.toString())
          : message.conversationId;
        addMessage(convId.toString(), message);
      }
    });

    socket.on('message_delivered', ({ conversationId, messageId, status }) => {
      updateMessageStatus(conversationId, messageId, status);
    });

    socket.on('message_read', ({ conversationId, messageIds, status }) => {
      messageIds.forEach((id: string) => updateMessageStatus(conversationId, id, status));
    });

    socket.on('message_reaction_added', ({ conversationId, messageId, reactions }) => {
      updateMessageReaction(conversationId, messageId, reactions);
    });

    socket.on('user_online', ({ userId }) => {
      setUserOnline(userId, true);
    });

    socket.on('user_offline', ({ userId }) => {
      setUserOnline(userId, false);
    });

    socket.on('typing_start', ({ conversationId, userName }) => {
      setTypingUser(conversationId, userName, true);
    });

    socket.on('typing_stop', ({ conversationId, userName }) => {
      setTypingUser(conversationId, userName, false);
    });

    socket.on('conversation_deleted', ({ conversationId }) => {
      removeConversation(conversationId);
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_delivered');
      socket.off('message_read');
      socket.off('message_reaction_added');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('conversation_deleted');
    };
  }, [accessToken, addMessage, updateMessageStatus, updateMessageReaction, setUserOnline, setTypingUser, removeConversation]);


  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden relative">
      <ChatLayout />
      <MediaViewerModal />
      <FloatingCoupleMusicWidget />
    </div>
  );
};
