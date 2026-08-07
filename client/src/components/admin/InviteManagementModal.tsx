import React, { useEffect, useState } from 'react';
import { X, Key, Copy, RefreshCw, Ban, Check, Sparkles, QrCode } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AdminInviteToken } from '../../types/admin.types';

interface InviteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationship: { id: string; name: string } | null;
}

export const InviteManagementModal: React.FC<InviteManagementModalProps> = ({
  isOpen,
  onClose,
  relationship,
}) => {
  const [invites, setInvites] = useState<AdminInviteToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Preset options: 1 Day, 7 Days, 30 Days, Never Expires (36500)
  const [targetRole, setTargetRole] = useState('MEMBER');
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [maxUses, setMaxUses] = useState<number>(1);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && relationship?.id) {
      fetchInvites();
    }
  }, [isOpen, relationship]);

  const fetchInvites = async () => {
    if (!relationship) return;
    setIsLoading(true);
    try {
      const res = await adminApi.getRelationshipInvites(relationship.id);
      setInvites(res);
    } catch (err) {
      console.error('Failed to fetch invites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relationship) return;
    setIsGenerating(true);
    try {
      await adminApi.generateRelationshipInvite(relationship.id, {
        targetRole,
        expiryDays,
        maxUses,
      });
      fetchInvites();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to generate invite');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (code: string) => {
    if (!relationship || !window.confirm('Revoke this invite token?')) return;
    try {
      await adminApi.revokeInvite(relationship.id, code);
      fetchInvites();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to revoke invite');
    }
  };

  const handleRegenerate = async (code: string) => {
    if (!relationship || !window.confirm('Regenerate a new invite token for this relationship?')) return;
    try {
      await adminApi.regenerateInvite(relationship.id, code);
      fetchInvites();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to regenerate invite');
    }
  };

  const handleCopyLink = (code: string) => {
    const origin = window.location.origin;
    const inviteUrl = `${origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(`link-${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyToken = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(`token-${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen || !relationship) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl text-white overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-base text-white">Invite Tokens</h3>
              <p className="text-xs text-slate-400">{relationship.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Generate Invite Form */}
          <form onSubmit={handleGenerate} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Generate New Invite Token
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="CO_OWNER">CO_OWNER</option>
                  <option value="SUPER_OWNER">SUPER_OWNER</option>
                  <option value="INVITED_USER">INVITED_USER</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Expiry Duration</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value={1}>1 Day</option>
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={36500}>Never Expires</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Max Uses</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {/* Disabled QR Code button per prompt spec */}
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-white/5 text-slate-500 text-xs font-semibold cursor-not-allowed opacity-60"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                  Coming Soon
                </span>
              </button>

              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Invite'}
              </button>
            </div>
          </form>

          {/* Invites Directory List */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Active & Historical Invites</h4>

            {isLoading ? (
              <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                Fetching invites...
              </div>
            ) : invites.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-medium bg-slate-800/40 rounded-2xl border border-white/5">
                No invite tokens generated for this relationship yet.
              </div>
            ) : (
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div
                    key={inv._id}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300 text-sm tracking-wider">{inv.code}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            inv.status === 'UNUSED'
                              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                              : inv.status === 'USED'
                              ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                              : inv.status === 'EXPIRED'
                              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                              : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[9px] font-bold">
                          {inv.targetRole}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Uses: <strong className="text-white">{inv.currentUses} / {inv.maxUses}</strong> • Expires:{' '}
                        <strong className="text-slate-200">
                          {new Date(inv.expiresAt).getFullYear() > 2100 ? 'Never' : new Date(inv.expiresAt).toLocaleDateString()}
                        </strong>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => handleCopyLink(inv.code)}
                        title="Copy Invite Link"
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        {copiedCode === `link-${inv.code}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                        {copiedCode === `link-${inv.code}` ? 'Link Copied' : 'Copy Link'}
                      </button>

                      <button
                        onClick={() => handleCopyToken(inv.code)}
                        title="Copy Token"
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
                      >
                        {copiedCode === `token-${inv.code}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {inv.status === 'UNUSED' && (
                        <button
                          onClick={() => handleRevoke(inv.code)}
                          title="Revoke Token"
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleRegenerate(inv.code)}
                        title="Regenerate Token"
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-800/50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
