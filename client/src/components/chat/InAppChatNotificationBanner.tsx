import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { socketClient } from '../../api/socketClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, MessageItem } from '../../types/index.js';

export const InAppChatNotificationBanner: React.FC = () => {
  const { user } = useAuthStore();
  const { activeConversation, setActiveConversation, addMessage, mobileView } = useChatStore();
  const { addToast } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeMessage, setActiveMessage] = useState<MessageItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isReplied, setIsReplied] = useState(false);

  const dismissTimerRef = useRef<any>(null);

  useEffect(() => {
    const handleIncomingMessage = (message: MessageItem) => {
      if (!message || !message.sender) return;

      const currentUserId = user?._id || user?.id;
      const senderId = typeof message.sender === 'object' ? (message.sender._id || message.sender.id) : message.sender;

      // Do NOT show notification banner for self messages
      if (senderId && currentUserId && senderId.toString() === currentUserId.toString()) {
        return;
      }

      const convId = typeof message.conversationId === 'object'
        ? (message.conversationId as any)?._id || (message.conversationId as any)?.id || message.conversationId
        : message.conversationId;

      // Do NOT show banner ONLY if user is currently actively viewing this specific chat thread on screen
      const isMobile = window.innerWidth < 1024;
      const isViewingActiveChatRoom =
        location.pathname.startsWith('/chat') &&
        activeConversation &&
        activeConversation._id?.toString() === convId?.toString() &&
        (!isMobile || mobileView === 'chat');

      if (isViewingActiveChatRoom) return;

      // Play soft Web Audio notification chime & vibration
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } catch (e) {}

      // OS System Notification Fallback (Works even if tab is minimized or backgrounded)
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const senderObj = typeof message.sender === 'object' ? message.sender : null;
          const sName = senderObj?.name || 'Afrin Universe';
          const sAvatar = senderObj?.avatar;

          new Notification(sName, {
            body: message.content || 'Sent a new message',
            icon: sAvatar || '/calculator_fevicon.png',
            tag: message._id,
          });
        }
      } catch (e) {}

      // Trigger Instagram-style Top In-App Notification Banner
      setActiveMessage(message);
      setReplyText('');
      setIsReplied(false);

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setActiveMessage(null);
      }, 7000);
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<MessageItem>;
      if (customEvent.detail) {
        handleIncomingMessage(customEvent.detail);
      }
    };

    window.addEventListener('in_app_chat_message', handleCustomEvent);

    const socket = socketClient.getSocket();
    if (socket) {
      socket.on('receive_message', handleIncomingMessage);
    }

    return () => {
      window.removeEventListener('in_app_chat_message', handleCustomEvent);
      if (socket) {
        socket.off('receive_message', handleIncomingMessage);
      }
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [user, activeConversation, location.pathname, mobileView]);

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setActiveMessage(null);
  };

  const handleOpenChat = () => {
    if (!activeMessage) return;

    const convId = typeof activeMessage.conversationId === 'object'
      ? (activeMessage.conversationId as any)?._id || (activeMessage.conversationId as any)?.id
      : activeMessage.conversationId;

    handleDismiss();

    // Navigate to chat route and set active conversation
    navigate('/chat');
    if (convId) {
      const stateConvs = useChatStore.getState().conversations;
      const found = stateConvs.find((c) => c._id.toString() === convId.toString());
      if (found) {
        setActiveConversation(found);
      }
    }
  };

  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMessage || !replyText.trim() || isSending) return;

    const convId = typeof activeMessage.conversationId === 'object'
      ? (activeMessage.conversationId as any)?._id || (activeMessage.conversationId as any)?.id || activeMessage.conversationId
      : activeMessage.conversationId;

    setIsSending(true);

    try {
      const payload = {
        conversationId: convId,
        type: 'TEXT' as const,
        content: replyText.trim(),
        replyToMessageId: activeMessage._id,
      };

      const res = await axiosClient.post<ApiResponse<MessageItem>>('/chat/messages', payload);
      if (res.data.data) {
        addMessage(convId.toString(), res.data.data);
      }

      setIsReplied(true);
      setReplyText('');
      addToast('Reply Sent', 'Your reply was sent instantly.', 'success');

      setTimeout(() => {
        handleDismiss();
      }, 1200);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to send quick reply', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!activeMessage) return null;

  const senderObj = typeof activeMessage.sender === 'object' ? activeMessage.sender : null;
  const senderName = senderObj?.name || 'Afzal & Amrin Verse';
  const senderAvatar = senderObj?.avatar;

  const getPreviewText = () => {
    if (activeMessage.type === 'IMAGE') return '📷 Sent a photo';
    if (activeMessage.type === 'VOICE') return '🎙️ Sent a voice note';
    if (activeMessage.type === 'VIDEO') return '📹 Sent a video';
    if (activeMessage.type === 'FILE') return '📁 Sent a file';
    return activeMessage.content || 'Sent a message';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -80, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 z-[300] sm:w-[380px] select-none"
      >
        <div className="glass-panel bg-obsidian-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-3.5 space-y-2.5 relative overflow-hidden">
          
          {/* Subtle Ambient Glow Pill */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-afzal/20 via-amrin/20 to-heart/20 rounded-full blur-xl pointer-events-none" />

          {/* Top Banner Header & Close Button */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div
              onClick={handleOpenChat}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[1.5px] shadow-md shrink-0 overflow-hidden">
                {senderAvatar ? (
                  <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-obsidian-950 rounded-full flex items-center justify-center font-bold text-xs text-white">
                    {senderName[0] || '❤️'}
                  </div>
                )}
              </div>

              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-xs font-extrabold text-white truncate group-hover:text-amrin-glow transition-colors">
                    {senderName}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5 shrink-0">
                    <MessageCircle className="w-2.5 h-2.5 text-amrin-glow" /> Just now
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                  {getPreviewText()}
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Instagram-Style Quick Inline Reply Bar */}
          {isReplied ? (
            <div className="text-center py-1 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
              <span>✓ Reply sent!</span>
            </div>
          ) : (
            <form onSubmit={handleSendQuickReply} className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${senderName.split(' ')[0]}...`}
                disabled={isSending}
                className="flex-1 bg-obsidian-900/90 border border-slate-700/80 rounded-full py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amrin disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                className="w-7 h-7 rounded-full bg-gradient-to-tr from-afzal to-amrin flex items-center justify-center text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shrink-0"
                title="Send Quick Reply"
              >
                {isSending ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : (
                  <Send className="w-3 h-3 ml-0.5" />
                )}
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
