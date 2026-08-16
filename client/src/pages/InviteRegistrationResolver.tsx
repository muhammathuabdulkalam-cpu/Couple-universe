import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  Lock,
  Layers,
  Users,
} from 'lucide-react';
import { inviteApi } from '../api/inviteApi';
import { ALL_FEATURES_CONFIG } from '../config/features';
import { useInviteRegistrationStore } from '../store/inviteRegistrationStore';
import { InviteValidationResult } from '../types/admin.types';

type Stage = 'loading' | 'valid' | 'invalid';

export const InviteRegistrationResolver: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setPendingInvite = useInviteRegistrationStore((state) => state.setPendingInvite);

  const [stage, setStage] = useState<Stage>('loading');
  const [invite, setInvite] = useState<InviteValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStage('invalid');
      setErrorMsg('No invitation token provided in URL.');
      return;
    }

    inviteApi
      .validateInvite(token)
      .then((data: InviteValidationResult) => {
        setInvite(data);

        // Always store pending invite for registration context
        setPendingInvite({
          token,
          relationshipId: data.relationshipId || '',
          relationshipName: data.relationshipName || 'Couple Universe',
          relationshipType: data.relationshipType || 'Couple',
          targetRole: data.targetRole || 'MEMBER',
          email: data.email,
          expiresAt: data.expiresAt,
        });

        setStage('valid');
      })
      .catch((err: any) => {
        setErrorMsg(err?.response?.data?.message || 'This invitation link is invalid or has expired.');
        setStage('invalid');
      });
  }, [token, setPendingInvite]);

  const handleAcceptInvite = () => {
    if (!token) return;
    navigate(`/register?invite=${token}`);
  };

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden select-none">
        {/* Background glow ambient effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto shadow-2xl shadow-rose-950/40">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Validating Invitation</h2>
            <p className="text-xs text-slate-400 mt-1">Connecting to Couple Universe private node...</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'invalid' || !invite) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden select-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-600/15 rounded-full blur-[150px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md bg-slate-900/80 border border-white/10 backdrop-blur-xl rounded-3xl p-8 text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Invitation Unavailable</h1>
            <p className="text-xs text-rose-300 font-medium leading-relaxed">{errorMsg}</p>
          </div>

          <p className="text-xs text-slate-400">
            Please ask the person who invited you to generate a new valid invitation link.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            Return to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  const isExpired = invite.status === 'EXPIRED';
  const isFullyUsed = invite.status === 'FULLY_USED';
  const isRevoked = invite.status === 'REVOKED';
  const isActive = invite.status === 'ACTIVE' || (!isExpired && !isFullyUsed && !isRevoked);

  const displayName = invite.inviteDisplayName || invite.relationshipName || 'Friend';
  const relationshipName = invite.relationshipName || 'Couple Universe Space';
  const relationshipType = invite.relationshipType || 'Couple';
  const targetRole = invite.targetRole || 'MEMBER';
  const enabledFeatures = invite.enabledFeatures || [];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden select-none">
      {/* Premium Ambient Glow Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Sparkle Particles */}
      <div className="absolute top-12 left-12 text-rose-500/20 animate-pulse pointer-events-none">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="absolute bottom-16 right-16 text-purple-500/20 animate-pulse pointer-events-none">
        <Heart className="w-10 h-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg bg-slate-900/85 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/80"
      >
        {/* HERO SECTION */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-extrabold tracking-widest uppercase shadow-sm">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-pulse" />
            <span>YOU'RE INVITED</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Welcome, <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">{displayName}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-semibold">
            to <span className="text-white font-extrabold">{relationshipName}</span>
          </p>

          <div className="pt-1">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-extrabold">
              A Private Digital Universe
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-md mx-auto">
              You've been invited to join a private relationship space created just for you.
            </p>
          </div>
        </div>

        {/* RELATIONSHIP DETAILS CARD */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Relationship Space</span>
            </span>
            <span className="font-extrabold text-white">{relationshipName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Relationship Type</span>
            </span>
            <span className="font-extrabold text-purple-300">{relationshipType}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Your Assigned Role</span>
            </span>
            <span className="font-extrabold text-emerald-300">{targetRole}</span>
          </div>
        </div>

        {/* FEATURE ACCESS PREVIEW */}
        {enabledFeatures.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                YOUR ACCESS INCLUDES ({enabledFeatures.length})
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {enabledFeatures.map((fKey) => {
                const cfg = ALL_FEATURES_CONFIG.find((c) => c.key === fKey);
                return (
                  <div
                    key={fKey}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="text-rose-400">✓</span>
                    <span>{cfg?.label || fKey}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INVITATION STATUS SECTION */}
        <div className="space-y-2">
          {isActive && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE INVITATION</span>
              </div>
              {invite.remainingUses !== undefined && invite.maxUses !== undefined && (
                <span className="text-slate-300 font-semibold text-[11px] flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <span>{invite.remainingUses} of {invite.maxUses} remaining</span>
                </span>
              )}
            </div>
          )}

          {isExpired && (
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-rose-300 font-extrabold text-xs">
                <Clock className="w-4 h-4" />
                <span>THIS INVITATION HAS EXPIRED</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Please ask the person who invited you to generate a new invitation link.
              </p>
            </div>
          )}

          {isFullyUsed && (
            <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-500/40 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-purple-300 font-extrabold text-xs">
                <Layers className="w-4 h-4" />
                <span>THIS INVITATION HAS REACHED MAXIMUM USERS</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                All account registration slots for this invitation link have been consumed.
              </p>
            </div>
          )}

          {isRevoked && (
            <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-300 font-extrabold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>THIS INVITATION IS NO LONGER AVAILABLE</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                This invitation token was revoked by the platform administrator.
              </p>
            </div>
          )}
        </div>

        {/* PRIMARY CTA */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleAcceptInvite}
            disabled={!isActive}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition shadow-2xl ${
              isActive
                ? 'bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-950/60 transform active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-50'
            }`}
          >
            <span>ACCEPT INVITATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-[11px] text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-rose-400 font-bold hover:underline ml-1"
            >
              Sign in instead
            </button>
          </p>
        </div>

        {/* PRIVACY FOOTER STATEMENT */}
        <div className="pt-2 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Your account is private to your assigned relationship space.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteRegistrationResolver;
