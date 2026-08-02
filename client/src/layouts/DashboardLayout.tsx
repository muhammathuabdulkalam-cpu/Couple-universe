import React, { useState } from 'react';
import { BottomNav } from '../components/layout/BottomNav.js';
import { Breadcrumb } from '../components/layout/Breadcrumb.js';
import { MobileHeader } from '../components/layout/MobileHeader.js';
import { Navbar } from '../components/layout/Navbar.js';
import { RightContextPanel } from '../components/layout/RightContextPanel.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { ToastContainer } from '../components/layout/ToastContainer.js';
import { NotificationPanel } from '../components/social/NotificationPanel.js';
import { useAuthStore } from '../store/authStore.js';
import { useNotificationStore } from '../store/notificationStore.js';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** When true: hides top navbar & right panel, removes main padding, disables page scroll for square edge edge-to-edge chat. */
  fullViewport?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, fullViewport = false }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(!fullViewport);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const { accessToken } = useAuthStore();
  const { initSocketListeners, fetchUnreadCounts } = useNotificationStore();

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

  return (
    <div className="relative flex flex-col bg-obsidian-950 text-slate-100 h-[100dvh] overflow-x-hidden overflow-y-hidden select-none w-full max-w-full">
      {/* Background Ambient Glow Spheres (Hidden on mobile to prevent overflow bleeding) */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[600px] bg-afzal/10 rounded-full blur-[150px] animate-pulse-glow hidden md:block" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-amrin/10 rounded-full blur-[150px] animate-pulse-glow hidden md:block" style={{ animationDelay: '2s' }} />

      {/* Top Navigation Bar & Instagram Mobile Header */}
      {!fullViewport && (
        <>
          <MobileHeader />
          <Navbar />
        </>
      )}

      {/* Main Application Workspace Shell */}
      <div className="flex w-full max-w-[1920px] mx-auto flex-1 min-h-0 overflow-hidden">
        {/* Left Expandable Sidebar */}
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />

        {/* Center Main Content Area */}
        <main
          className={`flex-1 min-w-0 h-full scroll-smooth ${fullViewport
            ? 'p-0 m-0 border-0 rounded-none overflow-hidden flex flex-col'
            : 'p-3 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto'
            }`}
        >
          {!fullViewport && <Breadcrumb />}
          {children}
        </main>

        {/* Right Collapsible Activity Panel */}
        {!fullViewport && (
          <RightContextPanel
            isOpen={isRightPanelOpen}
            onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Notification Drawer & Panel */}
      <NotificationPanel />

      {/* Dynamic Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
