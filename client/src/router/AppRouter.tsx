import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ElegantPlaceholderPage } from '../components/placeholder/ElegantPlaceholderPage.js';
import { Spinner } from '../components/ui/Spinner.js';
import { NAVIGATION_CONFIG } from '../config/navigation.config.js';
import { DashboardLayout } from '../layouts/DashboardLayout.js';
import { AuthGuard, GuestGuard, RoleGuard } from './guards.js';

// Lazy Loaded Auth Pages
const WelcomePage = lazy(() => import('../pages/auth/WelcomePage.js').then((m) => ({ default: m.WelcomePage })));
const LoginPage = lazy(() => import('../pages/auth/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage.js').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage.js').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage.js').then((m) => ({ default: m.ResetPasswordPage })));

// Lazy Loaded Protected Core Pages
const HomePage = lazy(() => import('../pages/HomePage.js').then((m) => ({ default: m.HomePage })));
const HealthDashboardPage = lazy(() => import('../pages/HealthDashboardPage.js').then((m) => ({ default: m.HealthDashboardPage })));

// Lazy Loaded Module 4 Media Pages
const GalleryPage = lazy(() => import('../pages/gallery/GalleryPage.js').then((m) => ({ default: m.GalleryPage })));

// Lazy Loaded Module 5 Timeline Page
const TimelinePage = lazy(() => import('../pages/timeline/TimelinePage.js').then((m) => ({ default: m.TimelinePage })));

// Lazy Loaded Module 6 Calendar Page
const CalendarPage = lazy(() => import('../pages/calendar/CalendarPage.js').then((m) => ({ default: m.CalendarPage })));

// Lazy Loaded Module 7 Chat Page
const ChatPage = lazy(() => import('../pages/chat/ChatPage.js').then((m) => ({ default: m.ChatPage })));

// Lazy Loaded Module 8 Profile Page
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage.js').then((m) => ({ default: m.ProfilePage })));

// Lazy Loaded Module 9 Social Pages
const SocialFeedPage = lazy(() => import('../pages/social/SocialFeedPage.js').then((m) => ({ default: m.SocialFeedPage })));
const StoriesPage = lazy(() => import('../pages/social/StoriesPage.js').then((m) => ({ default: m.StoriesPage })));

// Shared Music Page
const SharedMusicPage = lazy(() => import('../pages/SharedMusicPage.js').then((m) => ({ default: m.SharedMusicPage })));

// Lazy Loaded Error Pages
const UnauthorizedPage = lazy(() => import('../pages/error/UnauthorizedPage.js').then((m) => ({ default: m.UnauthorizedPage })));
const NotFoundPage = lazy(() => import('../pages/error/NotFoundPage.js').then((m) => ({ default: m.NotFoundPage })));

// Module X: Stealth Calculator Gateway (Lazy Loaded)
const StealthEntryPage = lazy(() => import('../pages/stealth/StealthEntryPage.js').then((m) => ({ default: m.StealthEntryPage })));

// Enterprise Admin Portal Pages (Lazy Loaded)
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage.js').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage.js').then((m) => ({ default: m.AdminDashboardPage })));
const AdminRouteGuard = lazy(() => import('./AdminRouteGuard.js').then((m) => ({ default: m.AdminRouteGuard })));
const InviteRegistrationResolver = lazy(() => import('../pages/InviteRegistrationResolver.js'));
const OnboardingPage = lazy(() => import('../pages/auth/OnboardingPage.js').then((m) => ({ default: m.OnboardingPage })));
import { FeatureRouteGuard } from '../components/auth/FeatureRouteGuard.js';
import { FEATURES } from '../config/features.js';

const SuspenseFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>

        {/* Public & Guest Routes */}
        <Route
          path="/welcome"
          element={
            <GuestGuard>
              <WelcomePage />
            </GuestGuard>
          }
        />
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route
          path="/register"
          element={
            <GuestGuard>
              <RegisterPage />
            </GuestGuard>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestGuard>
              <ForgotPasswordPage />
            </GuestGuard>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestGuard>
              <ResetPasswordPage />
            </GuestGuard>
          }
        />

        {/* Onboarding Profile Route */}
        <Route
          path="/onboarding"
          element={
            <AuthGuard>
              <OnboardingPage />
            </AuthGuard>
          }
        />

        {/* Authenticated Dashboard Workspace Routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardLayout>
                <HomePage />
              </DashboardLayout>
            </AuthGuard>
          }
        />

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Module 4 Media & Gallery Routes */}
        <Route
          path="/gallery"
          element={
            <AuthGuard>
              <FeatureRouteGuard featureKey={FEATURES.GALLERY}>
                <DashboardLayout>
                  <GalleryPage />
                </DashboardLayout>
              </FeatureRouteGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/albums"
          element={<Navigate to="/gallery" replace />}
        />

        {/* Module 5 Timeline Route */}
        <Route
          path="/timeline"
          element={
            <AuthGuard>
              <FeatureRouteGuard featureKey={FEATURES.TIMELINE}>
                <DashboardLayout>
                  <TimelinePage />
                </DashboardLayout>
              </FeatureRouteGuard>
            </AuthGuard>
          }
        />

        {/* Module 6 Calendar Route */}
        <Route
          path="/calendar"
          element={
            <AuthGuard>
              <FeatureRouteGuard featureKey={FEATURES.CALENDAR}>
                <DashboardLayout>
                  <CalendarPage />
                </DashboardLayout>
              </FeatureRouteGuard>
            </AuthGuard>
          }
        />

        {/* Module 7 Chat Route — full viewport sticky layout, no page scroll */}
        <Route
          path="/chat"
          element={
            <AuthGuard>
              <FeatureRouteGuard featureKey={FEATURES.CHAT}>
                <DashboardLayout fullViewport>
                  <ChatPage />
                </DashboardLayout>
              </FeatureRouteGuard>
            </AuthGuard>
          }
        />

        {/* Module 8 Profile Route */}
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </AuthGuard>
          }
        />

        {/* Module 9 Social Engine Routes */}
        <Route
          path="/feed"
          element={
            <AuthGuard>
              <DashboardLayout>
                <SocialFeedPage />
              </DashboardLayout>
            </AuthGuard>
          }
        />

        <Route
          path="/stories"
          element={
            <AuthGuard>
              <FeatureRouteGuard featureKey={FEATURES.STORIES}>
                <DashboardLayout>
                  <StoriesPage />
                </DashboardLayout>
              </FeatureRouteGuard>
            </AuthGuard>
          }
        />

        {/* Shared Music Route */}
        <Route
          path="/shared-music"
          element={
            <AuthGuard>
              <FeatureRouteGuard featureKey={FEATURES.MUSIC}>
                <DashboardLayout>
                  <SharedMusicPage />
                </DashboardLayout>
              </FeatureRouteGuard>
            </AuthGuard>
          }
        />

        <Route path="/settings" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/session-manager" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Enterprise Admin Portal Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRouteGuard>
              <AdminDashboardPage />
            </AdminRouteGuard>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Public Invite Resolution Route */}
        <Route path="/invite/:token" element={<InviteRegistrationResolver />} />

        <Route
          path="/developer-dashboard"
          element={
            <RoleGuard allowedRoles={['SUPER_OWNER']}>
              <HealthDashboardPage />
            </RoleGuard>
          }
        />

        {/* Dynamic Placeholder Feature Routes */}
        {NAVIGATION_CONFIG.filter((item) => !item.isImplemented).map((item) => (
          <Route
            key={item.key}
            path={item.path}
            element={
              <RoleGuard allowedRoles={item.allowedRoles}>
                <DashboardLayout>
                  <ElegantPlaceholderPage
                    title={`${item.label} Module`}
                    description={`The ${item.label} chapter is in active preparation for Afzal & Amrin's lifetime platform.`}
                    moduleTarget="Module 9"
                    icon={item.icon}
                  />
                </DashboardLayout>
              </RoleGuard>
            }
          />
        ))}

        {/* Module X: Stealth Calculator Gateway Route */}
        <Route path="/s/:token" element={<StealthEntryPage />} />

        {/* Error Fallback Routes */}
        <Route
          path="/unauthorized"
          element={
            <DashboardLayout>
              <UnauthorizedPage />
            </DashboardLayout>
          }
        />

        <Route
          path="*"
          element={
            <DashboardLayout>
              <NotFoundPage />
            </DashboardLayout>
          }
        />

      </Routes>
    </Suspense>
  );
};
