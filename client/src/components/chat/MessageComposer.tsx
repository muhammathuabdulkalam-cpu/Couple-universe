import { useQuery } from '@tanstack/react-query';
import { Check, Mic, Paperclip, Send, Smile, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { socketClient } from '../../api/socketClient.js';
import { useChatStore } from '../../store/chatStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, MediaItem, MessageItem } from '../../types/index.js';
import { VoiceRecorder } from './VoiceRecorder.js';

export const MessageComposer: React.FC = () => {
  const { activeConversation, addMessage, replyingToMessage, setReplyingToMessage } = useChatStore();
  const { addToast } = useUIStore();

  const [text, setText] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  const typingTimeoutRef = useRef<any>(null);

  // Fetch Module 4 Media Vault for Attachment Picker
  const { data: mediaVault } = useQuery<MediaItem[]>({
    queryKey: ['mediaListForChat'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<MediaItem[]>>('/media');
      return res.data.data!;
    },
    enabled: isMediaPickerOpen,
  });

  if (!activeConversation) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    // Emit socket typing events only when user is actually typing text
    const socket = socketClient.getSocket();
    if (socket && socket.connected) {
      if (val.trim().length > 0) {
        socket.emit('typing_start', { conversationId: activeConversation._id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing_stop', { conversationId: activeConversation._id });
        }, 1500);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', { conversationId: activeConversation._id });
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && !selectedMediaId) return;

    const payload = {
      conversationId: activeConversation._id,
      type: selectedMediaId ? ('IMAGE' as const) : ('TEXT' as const),
      content: text.trim(),
      mediaId: selectedMediaId || undefined,
      replyToMessageId: replyingToMessage ? replyingToMessage._id : undefined,
    };

    try {
      const res = await axiosClient.post<ApiResponse<MessageItem>>('/chat/messages', payload);
      if (res.data.data) {
        addMessage(activeConversation._id, res.data.data);
      }

      setText('');
      setSelectedMediaId(null);
      setReplyingToMessage(null);
      setIsMediaPickerOpen(false);
      setShowEmojiPicker(false);

      const socket = socketClient.getSocket();
      if (socket && socket.connected) {
        socket.emit('typing_stop', { conversationId: activeConversation._id });
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to send message', 'error');
    }
  };

  // Voice Note Upload Integration with Module 4 Cloudinary Engine
  const handleVoiceRecordingComplete = async (blob: Blob) => {
    setIsVoiceRecording(false);
    setIsUploadingVoice(true);

    try {
      const file = new File([blob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', 'Voice Message Note');
      formData.append('visibility', 'COUPLE');

      // Upload to Module 4 Media Storage
      const uploadRes = await axiosClient.post<ApiResponse<MediaItem>>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedMedia = uploadRes.data.data!;

      // Send VOICE message
      const payload = {
        conversationId: activeConversation._id,
        type: 'VOICE' as const,
        content: '🎙️ Voice Message',
        mediaId: uploadedMedia._id,
        replyToMessageId: replyingToMessage ? replyingToMessage._id : undefined,
      };

      const res = await axiosClient.post<ApiResponse<MessageItem>>('/chat/messages', payload);
      if (res.data.data) addMessage(activeConversation._id, res.data.data);

      setReplyingToMessage(null);
      addToast('Voice Sent!', 'Voice note uploaded & sent.', 'success');
    } catch (err: any) {
      addToast('Upload Error', err.message || 'Failed to upload voice note', 'error');
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="shrink-0 p-3 sm:p-4 glass-panel border-t border-white/10 space-y-2 z-30 bg-obsidian-950/90 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      
      {/* Replying Preview Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between glass-card px-3 py-1.5 rounded-xl border-amrin/30 text-xs">
          <div className="truncate">
            <span className="font-semibold text-amrin">Replying to {replyingToMessage.sender?.name}:</span>{' '}
            <span className="text-slate-300 truncate">{replyingToMessage.content || 'Attachment'}</span>
          </div>
          <button onClick={() => setReplyingToMessage(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recorder Active Mode */}
      {isVoiceRecording ? (
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecordingComplete}
          onCancel={() => setIsVoiceRecording(false)}
        />
      ) : isUploadingVoice ? (
        <div className="text-center py-2 text-xs text-amrin-glow font-semibold animate-pulse">
          Uploading voice message...
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="space-y-3 relative">
          
          {/* Emoji Popup Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-2 z-40 glass-card p-3 rounded-2xl border-white/10 shadow-2xl flex items-center gap-2">
              {['❤️', '😄', '😍', '🔥', '✨', '👍', '🙏', '🎉'].map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => handleEmojiSelect(e)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Module 4 Media Attachment Drawer */}
          {isMediaPickerOpen && mediaVault && (
            <div className="glass-card p-3 rounded-2xl max-h-40 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 border-white/10 mb-2">
              {mediaVault.map((m) => {
                const isSelected = selectedMediaId === m._id;
                return (
                  <div
                    key={m._id}
                    onClick={() => setSelectedMediaId(isSelected ? null : m._id)}
                    className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer border ${
                      isSelected ? 'border-amrin ring-2 ring-amrin' : 'border-white/10'
                    }`}
                  >
                    <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-amrin/40 flex items-center justify-center text-white">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* WhatsApp / Instagram Input Row */}
          <div className="flex items-center gap-2">
            
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Paperclip Attachment Button */}
            <button
              type="button"
              onClick={() => setIsMediaPickerOpen(!isMediaPickerOpen)}
              className={`p-2.5 rounded-full transition-colors shrink-0 ${
                selectedMediaId ? 'text-amrin bg-amrin/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Attach Media"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Input Box */}
            <input
              type="text"
              value={text}
              onChange={handleTextChange}
              placeholder="Message..."
              className="flex-1 bg-obsidian-950/80 border border-slate-700/80 rounded-full py-2.5 px-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amrin"
            />

            {/* Dynamic Button: Mic (when empty) vs Send (when text typed or media attached) */}
            {text.trim() || selectedMediaId ? (
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-afzal to-amrin flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsVoiceRecording(true)}
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 flex items-center justify-center text-slate-300 transition-all shrink-0"
                title="Record Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

          </div>

        </form>
      )}

    </div>
  );
};
