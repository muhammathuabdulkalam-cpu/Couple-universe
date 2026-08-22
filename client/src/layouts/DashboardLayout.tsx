import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socketClient } from '../api/socketClient.js';
import { InAppChatNotificationBanner } from '../components/chat/InAppChatNotificationBanner.js';
import { IncomingCallModal } from '../components/chat/IncomingCallModal.js';
import { ActiveCallScreen } from '../components/chat/ActiveCallScreen.js';
import { BottomNav } from '../components/layout/BottomNav.js';
import { Breadcrumb } from '../components/layout/Breadcrumb.js';
import { MobileHeader } from '../components/layout/MobileHeader.js';
import { Navbar } from '../components/layout/Navbar.js';
import { RightContextPanel } from '../components/layout/RightContextPanel.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { ToastContainer } from '../components/layout/ToastContainer.js';
import { ListenTogetherDrawer } from '../components/music/ListenTogetherDrawer.js';
import { ListenTogetherInviteBanner } from '../components/music/ListenTogetherInviteBanner.js';
import { MusicPlayerFloating } from '../components/music/MusicPlayerFloating.js';
import { NotificationPanel } from '../components/social/NotificationPanel.js';
import { WebRTCProvider } from '../context/WebRTCContext.js';
import { useAuthStore } from '../store/authStore.js';
import { useCallStore } from '../store/callStore.js';
import { useNotificationStore } from '../store/notificationStore.js';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** When true: hides top navbar & right panel, removes main padding, disables page scroll for square edge edge-to-edge chat. */
  fullViewport?: boolean;
}

export const DashboardLayoutContent: React.FC<DashboardLayoutProps> = ({ children, fullViewport = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isChatRoute = location.pathname.startsWith('/chat');

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const { accessToken } = useAuthStore();
  const { initSocketListeners, fetchUnreadCounts } = useNotificationStore();

  const { callStatus, remoteUser, setRinging, endCall } = useCallStore();
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  useEffect(() => {
    const handleNavigateMusic = () => {
      if (location.pathname !== '/shared-music') {
        navigate('/shared-music');
      }
    };
    window.addEventListener('navigate-shared-music', handleNavigateMusic);
    return () => window.removeEventListener('navigate-shared-music', handleNavigateMusic);
  }, [navigate, location.pathname]);

  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      let target = e.target as HTMLElement | null;
      if (target?.closest('.museum-container')) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  React.useEffect(() => {
    if (accessToken) {
      const cleanup = initSocketListeners(accessToken);
      fetchUnreadCounts();
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [accessToken, initSocketListeners, fetchUnreadCounts]);

  // ─── Global Call Socket Listeners ─────────────────────────────────────────
  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    const handleIncomingCall = (data: {
      callType: 'audio' | 'video';
      callerId: string;
      callerName: string;
      callerAvatar?: string;
    }) => {
      console.log('📞 Global Incoming Call Event Received:', data);
      if (useCallStore.getState().callStatus === 'idle') {
        setRinging(
          { userId: data.callerId, name: data.callerName, avatar: data.callerAvatar },
          data.callType
        );
      }
    };

    const handleWebRTCOffer = (data: { offer: RTCSessionDescriptionInit; fromUserId: string }) => {
      console.log('📩 Global WebRTC Offer Received');
      incomingOfferRef.current = data.offer;
    };

    const handleCallEnded = () => endCall();
    const handleCallRejected = () => endCall();

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:webrtc-offer', handleWebRTCOffer);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:rejected', handleCallRejected);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:webrtc-offer', handleWebRTCOffer);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:rejected', handleCallRejected);
    };
  }, [setRinging, endCall]);

  const callTargetId = remoteUser?.userId || '';

  return (
    <div className="relative w-full h-screen h-[100dvh] flex flex-col bg-slate-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      {/* Global Incoming Call Notification & Ringing Modal */}
      <IncomingCallModal offerRef={incomingOfferRef} />

      {/* Global Active Call & Calling Overlay Screen */}
      {(callStatus === 'active' || callStatus === 'calling') && (
        <ActiveCallScreen targetUserId={callTargetId} />
      )}

      {/* Listen Together Active Session Global Invite Banner */}
      <ListenTogetherInviteBanner />

      {/* Mobile Top App Bar */}
      <MobileHeader />

      {/* Main Top Header Navbar */}
      <Navbar />

      {/* Main Workspace Grid (Left Sidebar + Center Content + Right Panel) */}
      <div className="flex-1 min-h-0 w-full flex overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />

        {/* Center Main Content Area */}
        <main
          className={`flex-1 min-w-0 h-full scroll-smooth w-full max-w-full flex flex-col ${
            fullViewport
              ? 'p-0 m-0 border-0 rounded-none overflow-hidden'
              : isChatRoute
              ? 'p-0 pb-0 m-0 border-0 rounded-none lg:px-6 lg:pt-3 lg:pb-6 overflow-hidden'
              : 'p-3 sm:p-4 lg:px-6 lg:pt-3 lg:pb-6 pb-20 md:pb-6 overflow-y-auto overflow-x-hidden'
          }`}
        >
          {!fullViewport && !isChatRoute && <Breadcrumb />}
          {children}
        </main>

        {/* Right Collapsible Activity Panel */}
        <RightContextPanel
          isOpen={isRightPanelOpen}
          onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* In-App Chat Notification & Quick Reply Banner */}
      <InAppChatNotificationBanner />

      {/* Global Notification Panel */}
      <NotificationPanel />

      {/* Global Floating Mini Audio Player */}
      <MusicPlayerFloating />

      {/* Global Listen Together Control Drawer */}
      <ListenTogetherDrawer />

      {/* Dynamic Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => (
  <WebRTCProvider>
    <DashboardLayoutContent {...props} />
  </WebRTCProvider>
);
