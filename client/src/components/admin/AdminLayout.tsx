import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Search,
  Bell,
  ShieldCheck,
  Menu,
  X,
  Disc,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { Avatar } from '../ui/Avatar';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'dashboard',
  onSelectTab,
}) => {
  const navigate = useNavigate();
  const { admin, adminLogout, searchQuery, setSearchQuery } = useAdminAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users Management', icon: Users },
    { id: 'songs', label: 'Songs Management', icon: Disc },
  ];

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#08080B] text-slate-100 font-sans flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0E0E12]/90 border-b border-white/5 shrink-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">Admin Console</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 border border-white/10"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar (Fixed 100vh) */}
      <aside
        className={`fixed md:relative top-0 left-0 z-50 h-screen w-64 shrink-0 bg-[#0E0E12] border-r border-white/5 p-6 flex flex-col justify-between transition-transform duration-300 backdrop-blur-xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-wide text-white uppercase">Afrin Verse</h2>
              <p className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase">Enterprise Admin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onSelectTab) onSelectTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-xl font-extrabold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#16161E] border border-white/5 flex items-center gap-3">
            <Avatar
              src={admin?.avatar}
              name={admin?.name || 'Admin'}
              size="sm"
              className="border border-indigo-500/40"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-white truncate">{admin?.name || 'System Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{admin?.email || 'admin@gmail.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#16161E] hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 text-rose-400 text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Admin Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Fixed Navbar */}
        <header className="hidden md:flex shrink-0 items-center justify-between px-8 py-5 bg-[#0E0E12]/80 border-b border-white/5 z-30 backdrop-blur-md">
          {/* Global Search Capsule */}
          <div className="relative w-88">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search something..."
              className="w-full bg-[#16161E] border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Core Status Capsule */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#16161E] border border-white/5 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Core Server Online</span>
            </div>

            {/* Quick Action Button */}
            <button className="px-4 py-2 rounded-full bg-white text-slate-950 hover:bg-slate-200 text-xs font-black transition shadow-md">
              Enterprise Verified
            </button>

            {/* Notification Icon */}
            <button className="p-2.5 rounded-full text-slate-400 hover:text-white bg-[#16161E] border border-white/10 relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1 right-1" />
            </button>

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <Avatar
                src={admin?.avatar}
                name={admin?.name || 'Admin'}
                size="sm"
                className="border border-indigo-500/40 shadow-sm"
              />
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full bg-[#16161E] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs font-bold text-slate-300 hover:text-rose-300 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Component Scroll Area (Only this container scrolls vertically) */}
        <main className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto min-h-0 bg-[#08080B] custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
