import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse } from '../../types/index.js';

export const ForgotPasswordPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetTokenInfo, setResetTokenInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axiosClient.post<ApiResponse<{ resetToken?: string }>>('/auth/forgot-password', {
        email,
      });

      addToast('Reset Token Generated', response.data.message, 'success');
      if (response.data.data?.resetToken) {
        setResetTokenInfo(response.data.data.resetToken);
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to request reset token.', 'error');
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
            <div className="w-12 h-12 rounded-2xl bg-afzal/10 border border-afzal/30 flex items-center justify-center text-afzal mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Forgot Password</h2>
            <p className="text-xs text-slate-400">Enter your email to receive a password recovery token</p>
          </div>

          {resetTokenInfo && (
            <div className="mb-6 p-4 rounded-xl bg-cyan-950/40 border border-afzal/40 text-xs text-slate-200">
              <strong className="block text-afzal-glow mb-1">Development Mode Reset Token:</strong>
              <code className="block p-2 rounded bg-obsidian-950 font-mono text-xs break-all text-white">
                {resetTokenInfo}
              </code>
              <Link to={`/reset-password?token=${resetTokenInfo}`} className="inline-block mt-2 font-semibold text-afzal underline">
                Proceed to Reset Password Page
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@afrinuniverse.com"
                  required
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-afzal focus:ring-1 focus:ring-afzal transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="cyan"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Generate Reset Token
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
