import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { AdminInviteToken } from '../../types/admin.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  relationship: {
    id: string;
    name: string;
    members: Array<{ id: string; name: string; role: string; avatar?: string }>;
  } | null;
  allUsers: Array<{ id: string; name: string; email: string; avatar?: string }>;
}

const MemberManagementModal: React.FC<Props> = ({ isOpen, onClose, relationship, allUsers }) => {
  const [invites, setInvites] = useState<AdminInviteToken[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');
  const [selectedAddRole, setSelectedAddRole] = useState('MEMBER');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (isOpen && relationship) {
      loadInvites();
      setError('');
      setSuccessMsg('');
      setSelectedAddUserId('');
    }
  }, [isOpen, relationship]);

  if (!isOpen || !relationship) return null;

  const loadInvites = async () => {
    setLoadingInvites(true);
    try {
      const data = await adminApi.getRelationshipInvites(relationship.id);
      setInvites(data);
    } catch {
      // fail silently
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setActionLoading(userId);
    setError('');
    try {
      await adminApi.removeMember(relationship.id, userId);
      setSuccessMsg('Member removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
      onClose(); // caller reloads data
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove member.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddMember = async () => {
    if (!selectedAddUserId) return;
    setAddingMember(true);
    setError('');
    try {
      await adminApi.addMember(relationship.id, selectedAddUserId, selectedAddRole);
      setSuccessMsg('Member added successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setSelectedAddUserId('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    setError('');
    try {
      const invite = await adminApi.generateRelationshipInvite(relationship.id, { targetRole: 'MEMBER', expiryDays: 7, maxUses: 1 });
      setInvites(prev => [invite as any, ...prev]);
      setSuccessMsg('Invite token generated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to generate invite.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleRevokeInvite = async (code: string) => {
    setActionLoading(code);
    try {
      await adminApi.revokeInvite(relationship.id, code);
      await loadInvites();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to revoke invite.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyCode = (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2500);
    });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      UNUSED: '#22C55E',
      USED: '#6B7280',
      EXPIRED: '#EF4444',
      REVOKED: '#F97316',
    };
    return map[status] || '#6B7280';
  };

  // Filter out users already in relationship
  const memberIds = relationship.members.map(m => m.id);
  const availableUsers = allUsers.filter(u => !memberIds.includes(u.id));

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="admin-modal-header">
          <div className="admin-modal-icon" style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2 className="admin-modal-title">Member Management</h2>
            <p className="admin-modal-subtitle">{relationship.name}</p>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="admin-modal-body">
          {error && <div className="admin-modal-error">{error}</div>}
          {successMsg && <div className="admin-modal-success">{successMsg}</div>}

          {/* Current Members */}
          <div className="admin-mm-section">
            <h3 className="admin-mm-section-title">Current Members</h3>
            {relationship.members.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No members yet.</p>
            ) : (
              <div className="admin-mm-members-list">
                {relationship.members.map(m => (
                  <div key={m.id} className="admin-mm-member-row">
                    <div className="admin-mm-member-info">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="admin-mm-avatar" />
                      ) : (
                        <div className="admin-mm-avatar admin-mm-avatar-placeholder">{m.name?.charAt(0)?.toUpperCase()}</div>
                      )}
                      <div>
                        <div className="admin-mm-member-name">{m.name}</div>
                        <div className="admin-mm-member-role">{m.role}</div>
                      </div>
                    </div>
                    <button
                      className="admin-btn admin-btn-danger-ghost admin-btn-sm"
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={actionLoading === m.id}
                    >
                      {actionLoading === m.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ownership Transfer Notice */}
          <div className="admin-mm-coming-soon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
            Ownership Transfer — Coming Soon
          </div>

          {/* Add Member */}
          <div className="admin-mm-section">
            <h3 className="admin-mm-section-title">Add Member</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="admin-form-input"
                value={selectedAddUserId}
                onChange={e => setSelectedAddUserId(e.target.value)}
                style={{ flex: 2 }}
              >
                <option value="">Select user to add...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <select
                className="admin-form-input"
                value={selectedAddRole}
                onChange={e => setSelectedAddRole(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="MEMBER">Member</option>
                <option value="PRIMARY">Primary</option>
                <option value="INVITED_USER">Invited</option>
              </select>
              <button
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={handleAddMember}
                disabled={!selectedAddUserId || addingMember}
              >
                {addingMember ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>

          {/* Invite Tokens */}
          <div className="admin-mm-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="admin-mm-section-title" style={{ margin: 0 }}>Invite Tokens</h3>
              <button
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={handleGenerateInvite}
                disabled={generatingInvite}
              >
                {generatingInvite ? 'Generating...' : '+ Generate Token'}
              </button>
            </div>

            {loadingInvites ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading invites...</div>
            ) : invites.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No invite tokens generated yet.</p>
            ) : (
              <div className="admin-mm-invites-list">
                {invites.map((inv: any) => (
                  <div key={inv._id} className="admin-mm-invite-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="admin-mm-invite-code">{inv.code}</span>
                      <span
                        className="admin-status-badge"
                        style={{ background: getStatusBadge(inv.status) + '25', color: getStatusBadge(inv.status), fontSize: 11 }}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {inv.currentUses}/{inv.maxUses} uses
                      </span>
                      <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => handleCopyCode(inv.code)}
                        title="Copy invite link"
                      >
                        {copiedCode === inv.code ? '✓ Copied' : 'Copy Link'}
                      </button>
                      {inv.status === 'UNUSED' && (
                        <button
                          className="admin-btn admin-btn-danger-ghost admin-btn-sm"
                          onClick={() => handleRevokeInvite(inv.code)}
                          disabled={actionLoading === inv.code}
                        >
                          {actionLoading === inv.code ? 'Revoking...' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-modal-footer">
            <button className="admin-btn admin-btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberManagementModal;
