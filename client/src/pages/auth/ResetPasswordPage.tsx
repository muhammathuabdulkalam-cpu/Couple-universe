import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse } from '../../types/index.js';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useUIStore();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      addToast('Validation Error', 'New passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosClient.post<ApiResponse>('/auth/reset-password', {
        token,
        newPassword,
      });

      addToast('Password Updated', response.data.message, 'success');
      navigate('/login');
    } catch (err: any) {
      addToast('Reset Failed', err.message || 'Invalid or expired token.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>

        <Card variant="glass" className="p-8 border-white/10 shadow-2xl">
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Reset Password</h2>
            <p className="text-xs text-slate-400">Enter your reset token and your new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reset Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter reset token"
                required
                className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters with letters & numbers"
                  required
                  minLength={8}
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="violet"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Update Password
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
