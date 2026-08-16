import { motion } from 'framer-motion';
import { ArrowLeft, Key, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { useAuthStore } from '../../store/authStore.js';
import { useInviteRegistrationStore } from '../../store/inviteRegistrationStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, User } from '../../types/index.js';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchSystemStatus, systemStatus, setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const { pendingInvite, clearPendingInvite } = useInviteRegistrationStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(pendingInvite?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const urlInvite = searchParams.get('invite') || searchParams.get('inviteCode') || '';
  const [inviteCode, setInviteCode] = useState(pendingInvite?.token || urlInvite);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  useEffect(() => {
    if (pendingInvite?.token) {
      setInviteCode(pendingInvite.token);
    } else if (urlInvite) {
      setInviteCode(urlInvite);
    }
    if (pendingInvite?.email) {
      setEmail(pendingInvite.email);
    }
  }, [pendingInvite, urlInvite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast('Validation Error', 'Passwords do not match.', 'error');
      return;
    }

    if (!systemStatus?.isInitialSetupOpen && !inviteCode) {
      addToast('Invite Code Required', 'Public registration is closed. Please enter a valid invitation code.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosClient.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/register', {
        name,
        email,
        password,
        inviteCode: inviteCode ? inviteCode.trim().toUpperCase() : undefined,
      });

      const { user, accessToken } = response.data.data!;
      clearPendingInvite();
      setAuth(user, accessToken);
      addToast('Registration Complete!', `Account created successfully with role ${user.role}`, 'success');
      navigate('/');
    } catch (err: any) {
      addToast('Registration Failed', err.message || 'Unable to create account.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Welcome
          </Link>
        </div>

        <Card variant="glass" className="p-8 border-white/10 shadow-2xl">
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amrin to-heart p-0.5 mx-auto overflow-hidden shadow-xl">
              <img src="/logo.png" alt="Couple Universe Logo" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Account</h2>
            <p className="text-xs text-slate-400">Join the private Couple Universe digital ecosystem</p>
          </div>

          {/* System Mode Banner */}
          <div className="mb-6">
            {systemStatus?.isInitialSetupOpen ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <strong className="block text-emerald-200">First Account Initial Setup Mode</strong>
                  You will automatically become the permanent <Badge variant="green" size="sm">SUPER_OWNER</Badge>.
                </div>
              </div>
            ) : pendingInvite ? (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-2 text-xs text-purple-300">
                <Key className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                <div>
                  <strong className="block text-purple-200">Invited to {pendingInvite.relationshipName}</strong>
                  Joining as <span className="font-bold text-white">{pendingInvite.targetRole}</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amrin-950/40 border border-amrin/30 flex items-start gap-2 text-xs text-amrin-glow">
                <Key className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">Private Registration Mode</strong>
                  Public signup is closed. Enter your invite code below.
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Afzal / Amrin"
                  required
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@afrinuniverse.com"
                  required
                  disabled={!!pendingInvite?.email}
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors disabled:opacity-70"
                />
              </div>
            </div>

            {!systemStatus?.isInitialSetupOpen && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Invitation Code</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 8A3F9B2C"
                    required
                    readOnly={!!pendingInvite?.token}
                    className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-mono uppercase placeholder-slate-500 focus:outline-none focus:border-afzal focus:ring-1 focus:ring-afzal transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 chars with letters & numbers"
                  required
                  minLength={8}
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="violet"
              size="lg"
              className="w-full mt-4"
              isLoading={isLoading}
            >
              {systemStatus?.isInitialSetupOpen ? 'Initialize Super Owner' : 'Complete Registration'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-white/5 pt-4">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-amrin-glow hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
