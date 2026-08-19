import React, { useCallback, useEffect, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';
import { Skeleton } from '../ui/Skeleton.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse } from '../../types/index.js';
import { copyToClipboard } from '../../utils/clipboard.js';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Link2,
  RefreshCw,
  Shield,
  ShieldOff,
  Trash2,
} from 'lucide-react';

interface StealthConfigData {
  enabled: boolean;
  hasToken: boolean;
  isRevoked: boolean;
  lastUsed: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const StealthSettings: React.FC = () => {
  const { addToast } = useUIStore();
  const [config, setConfig] = useState<StealthConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [secretExpression, setSecretExpression] = useState('');
  const [isUpdatingSecret, setIsUpdatingSecret] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await axiosClient.get<ApiResponse<StealthConfigData>>('/stealth/config');
      setConfig(res.data.data!);
    } catch {
      setConfig({ enabled: false, hasToken: false, isRevoked: true, lastUsed: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleToggle = async (enable: boolean) => {
    setActionLoading(enable ? 'enable' : 'disable');
    try {
      await axiosClient.patch(`/stealth/${enable ? 'enable' : 'disable'}`);
      addToast('Stealth Mode', `Stealth mode ${enable ? 'enabled' : 'disabled'}`, enable ? 'success' : 'info');
      await fetchConfig();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to toggle stealth mode', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerate = async (regenerate = false) => {
    setActionLoading(regenerate ? 'regenerate' : 'generate');
    try {
      const res = await axiosClient.post<ApiResponse<{ token: string }>>(
        `/stealth/${regenerate ? 'regenerate' : 'generate'}`
      );
      const token = res.data.data!.token;

      const hostedDomain = (import.meta as any).env?.VITE_APP_URL || 'https://couple-universe.vercel.app';
      const cleanDomain = hostedDomain.replace(/\/+$/, '');
      const fullLink = `${cleanDomain}/s/${token}`;

      setGeneratedLink(fullLink);
      setIsCopied(false);
      addToast(
        regenerate ? 'Link Regenerated' : 'Link Generated',
        'Private link created. Copy it now — it won\'t be shown again.',
        'success'
      );
      await fetchConfig();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to generate link', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async () => {
    setActionLoading('revoke');
    try {
      await axiosClient.post('/stealth/revoke');
      setGeneratedLink(null);
      addToast('Token Revoked', 'Previous private link is now invalid.', 'warning');
      await fetchConfig();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to revoke token', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretExpression.trim() || secretExpression.trim().length < 3) {
      addToast('Validation', 'Expression must be at least 3 characters.', 'warning');
      return;
    }

    setIsUpdatingSecret(true);
    try {
      await axiosClient.patch('/stealth/secret', { expression: secretExpression.trim() });
      addToast('Secret Updated', 'Unlock expression updated successfully.', 'success');
      setSecretExpression('');
      setShowSecret(false);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update secret', 'error');
    } finally {
      setIsUpdatingSecret(false);
    }
  };

  const handleCopyLink = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      addToast('Copied!', 'Private link copied to clipboard', 'info');
      setTimeout(() => setIsCopied(false), 2500);
    } else {
      addToast('Copy Warning', 'Please select and copy the link manually.', 'warning');
    }
  };

  if (isLoading) {
    return (
      <Card variant="glass" className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-12" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card variant="glass" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Stealth Mode</h3>
              <p className="text-xs text-slate-400">Mobile calculator gateway for private access</p>
            </div>
          </div>
          <Badge variant={config?.enabled ? 'green' : 'gray'} size="sm">
            {config?.enabled ? 'ACTIVE' : 'INACTIVE'}
          </Badge>
        </div>

        <div className="flex items-center gap-3 pt-2">
          {config?.enabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggle(false)}
              isLoading={actionLoading === 'disable'}
              leftIcon={<ShieldOff className="w-4 h-4" />}
            >
              Disable Stealth
            </Button>
          ) : (
            <Button
              variant="cyan"
              size="sm"
              onClick={() => handleToggle(true)}
              isLoading={actionLoading === 'enable'}
              leftIcon={<Shield className="w-4 h-4" />}
            >
              Enable Stealth
            </Button>
          )}
        </div>

        {config?.lastUsed && (
          <div className="text-[11px] text-slate-400 pt-1">
            Last accessed: {new Date(config.lastUsed).toLocaleString()}
          </div>
        )}
      </Card>

      {/* Private Link Management */}
      <Card variant="glass" className="space-y-4">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-afzal" />
          Private Link
        </h4>

        {/* Token Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Token Status:</span>
          {config?.hasToken && !config?.isRevoked ? (
            <Badge variant="green" size="sm">Active</Badge>
          ) : config?.isRevoked ? (
            <Badge variant="rose" size="sm">Revoked</Badge>
          ) : (
            <Badge variant="gray" size="sm">No Token</Badge>
          )}
        </div>

        {/* Generated Link Display */}
        {generatedLink && (
          <div className="glass-card p-3 rounded-xl space-y-2">
            <div className="text-[11px] text-amber-400 font-semibold">⚠ Copy this link now — it won't be shown again</div>
            <div className="flex items-center gap-2">
              <code className="text-xs text-white bg-obsidian-950/80 px-3 py-2 rounded-lg flex-1 overflow-x-auto whitespace-nowrap font-mono select-all">
                {generatedLink}
              </code>
              <Button
                variant={isCopied ? 'cyan' : 'glass'}
                size="sm"
                onClick={() => handleCopyLink(generatedLink)}
                leftIcon={isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="cyan"
                size="sm"
                onClick={() => window.open(`${generatedLink}?preview=1`, '_blank')}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Test Calculator
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {!config?.hasToken || config?.isRevoked ? (
            <Button
              variant="cyan"
              size="sm"
              onClick={() => handleGenerate(false)}
              isLoading={actionLoading === 'generate'}
              leftIcon={<Key className="w-4 h-4" />}
            >
              Generate Link
            </Button>
          ) : (
            <>
              <Button
                variant="violet"
                size="sm"
                onClick={() => handleGenerate(true)}
                isLoading={actionLoading === 'regenerate'}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Regenerate
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRevoke}
                isLoading={actionLoading === 'revoke'}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Revoke
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Secret Expression */}
      <Card variant="glass" className="space-y-4">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-amrin" />
          Secret Unlock Expression
        </h4>
        <p className="text-xs text-slate-400">
          Configure the calculator expression that unlocks the app. Default: 9894+9248+09
        </p>

        <form onSubmit={handleUpdateSecret} className="space-y-3">
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secretExpression}
              onChange={(e) => setSecretExpression(e.target.value)}
              placeholder="Enter new secret expression"
              className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 px-4 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            type="submit"
            variant="violet"
            size="sm"
            isLoading={isUpdatingSecret}
            disabled={!secretExpression.trim()}
          >
            Update Secret
          </Button>
        </form>
      </Card>
    </div>
  );
};
