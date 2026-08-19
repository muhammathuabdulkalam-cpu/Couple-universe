import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, User } from '../../types/index.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Validation Error', 'Please enter your email and password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosClient.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', {
        email,
        password,
        rememberMe,
      });

      const { user, accessToken } = response.data.data!;
      setAuth(user, accessToken);
      addToast('Welcome Back!', `Logged in successfully as ${user.name}`, 'success');
      navigate('/');
    } catch (err: any) {
      addToast('Authentication Failed', err.message || 'Invalid email or password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-6 select-none">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-md">
        
        <div className="mb-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Welcome
          </Link>
        </div>

        <Card variant="glass" className="p-8 border-white/10 shadow-2xl">
          <div className="text-center space-y-2 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-afzal to-amrin p-0.5 mx-auto overflow-hidden shadow-xl">
              <img src="/logo.png" alt="Couple Universe Logo" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign In to Universe</h2>
            <p className="text-xs text-slate-400">Enter your credentials to access your private vault</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="afzal@afrinuniverse.com"
                  required
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 left-10 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-afzal focus:ring-1 focus:ring-afzal transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-amrin-glow hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-obsidian-950 text-amrin focus:ring-amrin"
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400 border-t border-white/5 pt-6">
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-afzal-glow hover:underline">
              Register via Invite Code
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
