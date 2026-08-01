import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Key, Lock, LogIn, Shield, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { useAuthStore } from '../../store/authStore.js';

export const WelcomePage: React.FC = () => {
  const { fetchSystemStatus, systemStatus } = useAuthStore();

  const { isLoading } = useQuery({
    queryKey: ['systemAuthStatus'],
    queryFn: fetchSystemStatus,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-6">
      
      {/* Hero Welcome Unit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-amrin/30 text-xs font-semibold text-amrin-glow">
          <Sparkles className="w-3.5 h-3.5" /> Private Digital Life Vault
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Welcome to <span className="gradient-text-couple">Afrin Universe ❤️</span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          The permanent, private digital home for <strong className="text-slate-200">Afzal & Amrin</strong>. 
          Preserving every memory, milestone, and chapter starting from <strong className="text-amrin-glow">March 26, 2026</strong>.
        </p>

        {/* System Registration Status Alert */}
        <div className="pt-4 flex justify-center">
          {isLoading ? (
            <Badge variant="gray" pulse>Checking System Auth Status...</Badge>
          ) : systemStatus?.isInitialSetupOpen ? (
            <Badge variant="green" pulse size="md" className="px-4 py-1.5 text-xs">
              <ShieldCheck className="w-4 h-4" /> System Setup Open: First Account becomes SUPER_OWNER
            </Badge>
          ) : (
            <Badge variant="violet" size="md" className="px-4 py-1.5 text-xs">
              <Lock className="w-4 h-4" /> Public Registration Closed • Invite Code Required
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Sign In Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card hoverEffect className="h-full flex flex-col justify-between p-8 border-afzal/20 bg-gradient-to-b from-obsidian-850/80 to-obsidian-900/90">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-afzal/10 border border-afzal/30 flex items-center justify-center text-afzal">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Sign In to Universe</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Access your encrypted profile, active sessions, and private memory vault.
              </p>
            </div>

            <div className="pt-8">
              <Link to="/login">
                <Button variant="cyan" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Proceed to Login
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Register / Claim Account Card */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card hoverEffect className="h-full flex flex-col justify-between p-8 border-amrin/20 bg-gradient-to-b from-obsidian-850/80 to-obsidian-900/90">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin">
                {systemStatus?.isInitialSetupOpen ? <Shield className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <h3 className="text-2xl font-bold text-white">
                {systemStatus?.isInitialSetupOpen ? 'Claim Super Owner' : 'Join via Invitation'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {systemStatus?.isInitialSetupOpen
                  ? 'No accounts exist yet. Register now to claim the permanent SUPER_OWNER role.'
                  : 'Register using a valid 8-character invitation code issued by the Super Owner.'}
              </p>
            </div>

            <div className="pt-8">
              <Link to="/register">
                <Button
                  variant="violet"
                  size="lg"
                  className="w-full"
                  rightIcon={<Key className="w-4 h-4" />}
                >
                  {systemStatus?.isInitialSetupOpen ? 'Setup Super Owner' : 'Enter Invite Code'}
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Security Architecture Footnote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6 text-center max-w-3xl mx-auto border-white/10"
      >
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
          <Heart className="w-4 h-4 text-heart fill-heart" />
          <span>Built for Afzal & Amrin</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Dual JWT Tokens • HttpOnly Cookies • bcryptjs Salt 12</span>
        </div>
      </motion.div>

    </div>
  );
};
