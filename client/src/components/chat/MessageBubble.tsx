import { motion } from 'framer-motion';
import {
  Check,
  CheckCheck,
  CornerDownRight,
  Pin,
  Reply,
  Smile,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MessageItem } from '../../types/index.js';

interface MessageBubbleProps {
  message: MessageItem;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { openViewer } = useMediaStore();
  const { setReplyingToMessage } = useChatStore();

  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isSender = message.sender?._id === user?.id || message.sender?.id === user?.id;
  const isDeleted = message.isDeleted;

  const handleAddReaction = async (emoji: string) => {
    try {
      await axiosClient.post(`/chat/messages/${message._id}/reaction`, { emoji });
      setShowEmojiPicker(false);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to add reaction', 'error');
    }
  };

  const handleTogglePin = async () => {
    try {
      await axiosClient.patch(`/chat/messages/${message._id}/pin`);
      addToast('Message Pinned', 'Updated pinned message status.', 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to pin message', 'error');
    }
  };

  const handleDeleteForEveryone = async () => {
    try {
      await axiosClient.delete(`/chat/messages/${message._id}?deleteForEveryone=true`);
      addToast('Message Deleted', 'Deleted message for everyone.', 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete message', 'error');
    }
  };

  const renderStatus = () => {
    if (!isSender) return null;
    if (message.status === 'READ') {
      return (
        <span title="Read">
          <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
        </span>
      );
    }
    if (message.status === 'DELIVERED') {
      return (
        <span title="Delivered">
          <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check className="w-3.5 h-3.5 text-slate-400" />
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col select-none my-1.5 ${isSender ? 'items-end' : 'items-start'}`}
    >
      {/* Sender Name in Chat */}
      {!isSender && message.sender && (
        <button
          type="button"
          onClick={() => {
            const senderId = (message.sender as any)?._id || (message.sender as any)?.id;
            if (senderId) {
              navigate('/profile', { state: { targetUserId: senderId.toString() } });
            }
          }}
          className="text-[10px] text-slate-400 font-semibold mb-1 ml-2 hover:underline cursor-pointer"
        >
          {message.sender?.name}
        </button>
      )}

      {/* Reply Preview Header */}
      {message.replyToMessageId && (
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 px-3 py-1 glass-card rounded-xl border-white/5 max-w-xs truncate">
          <CornerDownRight className="w-3 h-3 text-amrin" />
          <span className="font-semibold text-amrin">{message.replyToMessageId.sender?.name}:</span>
          <span className="truncate">{message.replyToMessageId.content || 'Attached Media'}</span>
        </div>
      )}

      <div className="relative group max-w-[85%] sm:max-w-md">
        
        {/* Main Message Bubble */}
        <div
          className={`p-3 sm:p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed transition-all shadow-lg ${
            isSender
              ? 'bg-gradient-to-r from-afzal/90 to-amrin/90 text-white rounded-br-none border-white/20'
              : 'glass-card text-slate-100 rounded-bl-none border-white/10'
          }`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          
          {/* Pinned Indicator */}
          {message.isPinned && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 mb-1">
              <Pin className="w-3 h-3" /> Pinned Message
            </div>
          )}

          {/* Module 4 Media Item Preview (Google Photos Style Uncropped) */}
          {message.mediaId && (
            <div
              onClick={() => openViewer(message.mediaId!)}
              className="rounded-xl overflow-hidden glass-card border border-white/10 bg-obsidian-950/90 my-1 cursor-pointer max-h-60 flex items-center justify-center p-1"
            >
              <img
                src={message.mediaId.optimizedUrl || message.mediaId.thumbnailUrl || message.mediaId.secureUrl}
                alt={message.mediaId.title}
                className="w-full h-full object-contain max-h-56 rounded-lg"
              />
            </div>
          )}

          {/* Text Content */}
          {isDeleted ? (
            <span className="italic text-slate-400">This message was deleted</span>
          ) : (
            <p className="whitespace-pre-line">{message.content}</p>
          )}

          {/* Footer Timestamp & Status */}
          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-300 opacity-80">
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {renderStatus()}
          </div>
        </div>

        {/* Emoji Reactions Badges */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {message.reactions.map((r, idx) => (
              <span
                key={idx}
                className="glass-card px-2 py-0.5 rounded-full text-xs border-white/10 text-white shadow"
              >
                {r.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Hover Action Menu */}
        {showActions && (
          <div
            className={`absolute top-0 -translate-y-1/2 flex items-center gap-1 glass-card p-1 rounded-full border-white/10 z-20 shadow-xl ${
              isSender ? 'right-full mr-2' : 'left-full ml-2'
            }`}
          >
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-full text-slate-300 hover:text-amber-400"
              title="Add Reaction"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setReplyingToMessage(message)}
              className="p-1.5 rounded-full text-slate-300 hover:text-white"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleTogglePin}
              className="p-1.5 rounded-full text-slate-300 hover:text-white"
              title="Pin Message"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            {isSender && !isDeleted && (
              <button
                onClick={handleDeleteForEveryone}
                className="p-1.5 rounded-full text-slate-300 hover:text-rose-400"
                title="Delete for Everyone"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute top-8 z-30 flex items-center gap-2 glass-card p-2 rounded-2xl border-white/10 shadow-2xl">
            {['❤️', '😂', '👍', '🔥', '🎉', '😮'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

      </div>
    </motion.div>
  );
};
