import React, { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import { ChatHeader } from './ChatHeader.js';
import { ConversationList } from './ConversationList.js';
import { MessageComposer } from './MessageComposer.js';
import { MessageContainer } from './MessageContainer.js';
import { TypingIndicator } from './TypingIndicator.js';

export const ChatLayout: React.FC = () => {
  const { activeConversation, typingUsers, mobileView, setMobileView } = useChatStore();

  const conversationId = activeConversation?._id;
  const currentTyping = conversationId ? typingUsers[conversationId] || [] : [];

  const handleSelectConversation = () => setMobileView('chat');
  const handleBackToList = () => setMobileView('list');

  // Reset to list view on unmount
  useEffect(() => {
    return () => {
      setMobileView('list');
    };
  }, [setMobileView]);

  return (
    /**
     * Root container (Instagram style full-screen square edges):
     *   - h-full w-full → fills screen edge-to-edge
     *   - rounded-none border-0 → square edges, no outer gaps
     *   - pb-16 md:pb-0 when on conversation list view so bottom nav is accessible
     *   - pb-0 when inside chat thread so input bar uses 100% height
     */
    <div
      className={`w-full h-full flex overflow-hidden rounded-none lg:rounded-3xl border-0 lg:border lg:border-white/10 bg-obsidian-950/90 backdrop-blur-xl shadow-2xl ${
        mobileView === 'list' ? 'pb-16 md:pb-0' : 'pb-0'
      }`}
    >

      {/* ─── Conversation List Sidebar ─────────────────────────────────────────── */}
      <div
        className={`h-full flex flex-col shrink-0 w-full lg:w-80 xl:w-96 border-r border-white/10 overflow-hidden ${
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* ConversationList fills this column and scrolls internally */}
        <ConversationList onSelectConversation={handleSelectConversation} />
      </div>

      {/* ─── Chat Workspace Panel ──────────────────────────────────────────────── */}
      <div
        className={`flex-1 min-w-0 h-full flex flex-col bg-obsidian-950/60 overflow-hidden ${
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Fixed Header — never scrolls */}
            <ChatHeader onBackClick={handleBackToList} />

            {/* Scrollable Messages — flex-1 + min-h-0 is the magic combo */}
            <MessageContainer />

            {/* Typing indicator pinned above composer */}
            <TypingIndicator userNames={currentTyping} />

            {/* Fixed Composer bar at bottom */}
            <MessageComposer />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin text-2xl">
              💬
            </div>
            <h3 className="text-lg font-bold text-white">Select a Chat to Start Messaging</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Choose a conversation from the sidebar or open the Relationship Room.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
