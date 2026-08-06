import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Heart,
  Server,
  Activity,
  HardDrive,
  Settings,
  LogOut,
  Search,
  Bell,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/adminAuthStore';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { admin, adminLogout, searchQuery, setSearchQuery } = useAdminAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, isFunctional: true },
    { label: 'Users', icon: Users, isFunctional: false },
    { label: 'Relationships', icon: Heart, isFunctional: false },
    { label: 'System', icon: Server, isFunctional: false },
    { label: 'Activity', icon: Activity, isFunctional: false },
    { label: 'Storage', icon: HardDrive, isFunctional: false },
    { label: 'Settings', icon: Settings, isFunctional: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-rose-500" />
          <span className="font-extrabold text-base tracking-tight text-white">Admin Console</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900/95 border-r border-white/10 p-5 flex flex-col justify-between transition-transform duration-300 backdrop-blur-xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-wide text-white uppercase">Couple Universe</h2>
              <p className="text-[10px] text-rose-400 font-semibold tracking-wider uppercase">Enterprise Console</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  item.isFunctional
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${item.isFunctional ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {!item.isFunctional && (
                  <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                    SOON
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <img
              src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
              alt="Admin Avatar"
              className="w-8 h-8 rounded-full object-cover border border-white/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{admin?.name || 'System Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{admin?.email || 'admin@gmail.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Admin Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/40 border-b border-white/10 sticky top-0 z-30 backdrop-blur-md">
          {/* Global Search */}
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Email, Role..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Right Header Status Controls */}
          <div className="flex items-center gap-4">
            {/* System Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Core Server Online</span>
            </div>

            {/* Notification Icon */}
            <button className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 border border-white/10 relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1" />
            </button>

            {/* Admin Avatar & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <img
                src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                alt="Admin Profile"
                className="w-9 h-9 rounded-full object-cover border border-rose-500/40 shadow-sm"
              />
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs font-semibold text-slate-300 hover:text-rose-300 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="p-4 sm:p-6 md:p-8 space-y-8 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
