import React, { useEffect, useState } from 'react';
import {
  X,
  Key,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Heart,
  Users as UsersIcon,
  Clock,
  Layers,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  FolderPlus,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { ALL_FEATURES_CONFIG, FeatureKey } from '../../config/features';
import { AdminRelationshipItem, AdminInviteToken } from '../../types/admin.types';

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  relationships?: AdminRelationshipItem[];
}

const RELATIONSHIP_TYPES = ['Couple', 'Friendship', 'Family', 'Custom'];
const TARGET_ROLES = [
  { value: 'CO_OWNER', label: 'CO_OWNER (Relationship Partner)' },
  { value: 'MEMBER', label: 'MEMBER (Relationship Member)' },
  { value: 'INVITED_USER', label: 'INVITED_USER (Standard Guest)' },
];

const EXPIRY_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: 'Never Expires', value: 36500 },
];

export const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  relationships: initialRelationships = [],
}) => {
  // Form State
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  
  // Relationship Selection Mode: 'existing' vs 'new'
  const [relMode, setRelMode] = useState<'existing' | 'new'>('existing');
  const [selectedRelId, setSelectedRelId] = useState<string>('');
  const [newRelName, setNewRelName] = useState('');
  const [newRelType, setNewRelType] = useState('Couple');
  
  const [fetchedRelationships, setFetchedRelationships] = useState<AdminRelationshipItem[]>(initialRelationships);

  const [targetRole, setTargetRole] = useState('MEMBER');
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([
    'GALLERY',
    'TIMELINE',
    'CALENDAR',
    'STORIES',
    'CHAT',
    'MUSIC',
    'LISTEN_TOGETHER',
  ]);

  // Max Uses & Expiry
  const [maxUsesPreset, setMaxUsesPreset] = useState<'1' | '5' | '10' | 'custom'>('1');
  const [customMaxUses, setCustomMaxUses] = useState<number>(1);
  const [expiryDays, setExpiryDays] = useState<number>(7);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdInvite, setCreatedInvite] = useState<{
    token: string;
    inviteUrl: string;
    relationshipName: string;
    relationshipType: string;
    targetRole: string;
    enabledFeatures: string[];
    expiryDays: number;
    maxUses: number;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRelationships();
      setInviteDisplayName('');
      setRelMode('existing');
      setSelectedRelId('');
      setNewRelName('');
      setNewRelType('Couple');
      setTargetRole('MEMBER');
      setMaxUsesPreset('1');
      setCustomMaxUses(1);
      setExpiryDays(7);
      setErrorMsg('');
      setCreatedInvite(null);
      setCopiedLink(false);
    }
  }, [isOpen]);

  const loadRelationships = async () => {
    try {
      const rels = await adminApi.getRelationships();
      setFetchedRelationships(rels);
    } catch {
      setFetchedRelationships(initialRelationships);
    }
  };

  if (!isOpen) return null;

  const toggleFeature = (key: FeatureKey) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllFeatures = () => {
    if (selectedFeatures.length === ALL_FEATURES_CONFIG.length) {
      setSelectedFeatures([]);
    } else {
      setSelectedFeatures(ALL_FEATURES_CONFIG.map((f) => f.key));
    }
  };

  const getEffectiveMaxUses = (): number => {
    if (maxUsesPreset === 'custom') return Math.max(1, customMaxUses);
    return Number(maxUsesPreset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!inviteDisplayName.trim()) {
      setErrorMsg('Please enter an Invite Display Name.');
      return;
    }

    if (relMode === 'existing' && !selectedRelId) {
      setErrorMsg('Please select an existing relationship or switch to "+ Create New Relationship".');
      return;
    }

    if (relMode === 'new' && !newRelName.trim()) {
      setErrorMsg('Please enter a Relationship Name for the new relationship.');
      return;
    }

    if (selectedFeatures.length === 0) {
      setErrorMsg('Please select at least one enabled feature for this invitation.');
      return;
    }

    const effectiveMaxUses = getEffectiveMaxUses();
    setIsLoading(true);

    try {
      let inviteData: AdminInviteToken;

      if (relMode === 'existing') {
        const relObj = fetchedRelationships.find((r) => r.id === selectedRelId);
        inviteData = await adminApi.generateRelationshipInvite(selectedRelId, {
          targetRole,
          enabledFeatures: selectedFeatures,
          expiryDays,
          maxUses: effectiveMaxUses,
          inviteDisplayName: inviteDisplayName.trim(),
          relationshipType: relObj?.type || 'Couple',
        });
      } else {
        inviteData = await adminApi.generateRelationshipInvite('new', {
          relationshipName: newRelName.trim(),
          relationshipType: newRelType,
          targetRole,
          enabledFeatures: selectedFeatures,
          expiryDays,
          maxUses: effectiveMaxUses,
          inviteDisplayName: inviteDisplayName.trim(),
        });
      }

      const token = inviteData.code;
      const origin = window.location.origin;
      const inviteUrl = `${origin}/invite/${token}`;

      let displayRelName = '';
      let displayRelType = 'Couple';

      if (relMode === 'existing') {
        const relObj = fetchedRelationships.find((r) => r.id === selectedRelId);
        displayRelName = relObj?.name || 'Existing Relationship';
        displayRelType = relObj?.type || 'Couple';
      } else {
        displayRelName = newRelName.trim();
        displayRelType = newRelType;
      }

      setCreatedInvite({
        token,
        inviteUrl,
        relationshipName: displayRelName,
        relationshipType: displayRelType,
        targetRole,
        enabledFeatures: selectedFeatures,
        expiryDays,
        maxUses: effectiveMaxUses,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to generate invitation token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInvite) return;
    navigator.clipboard.writeText(createdInvite.inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleResetForm = () => {
    setCreatedInvite(null);
    setInviteDisplayName('');
    setSelectedRelId('');
    setNewRelName('');
    setErrorMsg('');
    setCopiedLink(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl text-white overflow-hidden shadow-2xl space-y-0 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-600 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-rose-400">
                <Key className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
                <span>Create Invitation</span>
                <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-400">
                Invite users to Couple Universe with controlled relationship binding and feature permissions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!createdInvite ? (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: INVITATION */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 1. INVITATION PREVIEW NAME
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    INVITE DISPLAY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteDisplayName}
                    onChange={(e) => setInviteDisplayName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    This name is only shown in the invitation preview. The invited user will create their own profile (name, username, bio, avatar) during onboarding.
                  </p>
                </div>
              </div>

              {/* SECTION 2: RELATIONSHIP */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> 2. RELATIONSHIP SELECTION
                </h3>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => setRelMode('existing')}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                      relMode === 'existing'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <UsersIcon className="w-3.5 h-3.5" />
                    <span>Existing Relationship</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRelMode('new')}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                      relMode === 'new'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Create New Relationship</span>
                  </button>
                </div>

                {relMode === 'existing' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      SELECT EXISTING RELATIONSHIP *
                    </label>
                    <select
                      value={selectedRelId}
                      onChange={(e) => setSelectedRelId(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    >
                      <option value="">-- Select Existing Relationship --</option>
                      {fetchedRelationships.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.type || 'Couple'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        NEW RELATIONSHIP NAME *
                      </label>
                      <input
                        type="text"
                        required={relMode === 'new'}
                        value={newRelName}
                        onChange={(e) => setNewRelName(e.target.value)}
                        placeholder="e.g. Sarah & John"
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        RELATIONSHIP TYPE *
                      </label>
                      <select
                        value={newRelType}
                        onChange={(e) => setNewRelType(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      >
                        {RELATIONSHIP_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: ACCESS */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 3. ACCESS PERMISSIONS & ROLE
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    TARGET ROLE *
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  >
                    {TARGET_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enabled Features Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200">
                      ENABLED FEATURES * ({selectedFeatures.length} / {ALL_FEATURES_CONFIG.length} Selected)
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllFeatures}
                      className="text-[11px] font-bold text-rose-400 hover:underline"
                    >
                      {selectedFeatures.length === ALL_FEATURES_CONFIG.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 border border-white/5 rounded-2xl bg-slate-950/40">
                    {ALL_FEATURES_CONFIG.map((feat) => {
                      const isChecked = selectedFeatures.includes(feat.key);

                      return (
                        <div
                          key={feat.key}
                          onClick={() => toggleFeature(feat.key)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-rose-500/15 border-rose-500/40 text-white'
                              : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-rose-500 pointer-events-none"
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold truncate">{feat.label}</p>
                              <p className="text-[10px] text-slate-400 truncate">{feat.description}</p>
                            </div>
                          </div>

                          {isChecked && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-1" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4: INVITATION LIMITS */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 4. INVITATION CAPACITY & EXPIRY
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Maximum Uses */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      MAXIMUM INVITATION USES *
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={maxUsesPreset}
                        onChange={(e) => setMaxUsesPreset(e.target.value as any)}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      >
                        <option value="1">1 User (Single-Use)</option>
                        <option value="5">5 Users</option>
                        <option value="10">10 Users</option>
                        <option value="custom">Custom Capacity</option>
                      </select>

                      {maxUsesPreset === 'custom' && (
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={customMaxUses}
                          onChange={(e) => setCustomMaxUses(Number(e.target.value))}
                          className="w-24 bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Maximum number of separate user accounts that can register using this invitation.
                    </p>
                  </div>

                  {/* Expiry Duration */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      EXPIRY DURATION *
                    </label>
                    <select
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    >
                      {EXPIRY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transform active:scale-95 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Generating...</span>
                  ) : (
                    <>
                      <span>Generate Invitation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Success State View Inside Modal */
            <div className="space-y-5">
              <div className="text-center p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-white">Invitation Generated ✓</h3>
                <p className="text-xs text-slate-300">
                  Share this secure invitation URL with the invited partner or group members.
                </p>
              </div>

              {/* Invitation Link Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  INVITATION LINK
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdInvite.inviteUrl}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-rose-300 font-mono focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition shadow"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? '✓ Link Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Details Summary Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Invite Display Name</span>
                  <span className="font-bold text-rose-300">{inviteDisplayName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Relationship</span>
                  </span>
                  <span className="font-bold text-white">{createdInvite.relationshipName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <UsersIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Relationship Type / Target Role</span>
                  </span>
                  <span className="font-bold text-purple-300">
                    {createdInvite.relationshipType} • {createdInvite.targetRole}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Expires</span>
                  </span>
                  <span className="font-bold text-amber-300">
                    {createdInvite.expiryDays === 36500 ? 'Never Expires' : `${createdInvite.expiryDays} Days`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Usage Limit</span>
                  </span>
                  <span className="font-bold text-white">0 / {createdInvite.maxUses} Used</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enabled Features ({createdInvite.enabledFeatures.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {createdInvite.enabledFeatures.map((fKey) => {
                      const cfg = ALL_FEATURES_CONFIG.find((c) => c.key === fKey);
                      return (
                        <span
                          key={fKey}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 border border-white/10 text-[11px] font-semibold text-slate-200"
                        >
                          ✓ {cfg?.label || fKey}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>

                <a
                  href={createdInvite.inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Invite</span>
                </a>

                <button
                  onClick={handleResetForm}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Create Another</span>
                </button>

                <button
                  onClick={onClose}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
