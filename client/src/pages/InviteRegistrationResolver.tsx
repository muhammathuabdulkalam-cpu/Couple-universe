import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inviteApi } from '../api/inviteApi';
import { useInviteRegistrationStore } from '../store/inviteRegistrationStore';
import { InviteValidationResult } from '../types/admin.types';

type Stage = 'loading' | 'valid' | 'invalid';

const InviteRegistrationResolver: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setPendingInvite = useInviteRegistrationStore((state) => state.setPendingInvite);

  const [stage, setStage] = useState<Stage>('loading');
  const [invite, setInvite] = useState<InviteValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStage('invalid');
      setErrorMsg('No invite token provided.');
      return;
    }

    inviteApi
      .validateInvite(token)
      .then((data: InviteValidationResult) => {
        setInvite(data);
        setPendingInvite({
          token,
          relationshipId: data.relationshipId,
          relationshipName: data.relationshipName,
          relationshipType: data.relationshipType,
          targetRole: data.targetRole,
          email: data.email,
          expiresAt: data.expiresAt,
        });
        setStage('valid');
      })
      .catch((err: any) => {
        setErrorMsg(err?.response?.data?.message || 'This invite link is invalid or has expired.');
        setStage('invalid');
      });
  }, [token, setPendingInvite]);

  const handleAcceptInvite = () => {
    navigate('/register');
  };

  if (stage === 'loading') {
    return (
      <div className="invite-resolver-page">
        <div className="invite-resolver-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div className="admin-loader-spinner" />
          </div>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Validating your invite link...</p>
        </div>
      </div>
    );
  }

  if (stage === 'invalid') {
    return (
      <div className="invite-resolver-page">
        <div className="invite-resolver-card">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} style={{ width: 32, height: 32 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>Invite Invalid</h1>
          <p style={{ color: '#f87171', fontSize: 14, marginBottom: 28 }}>{errorMsg}</p>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => navigate('/')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-resolver-page">
      <div className="invite-resolver-card">
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.2))',
            border: '2px solid rgba(236,72,153,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth={2} style={{ width: 36, height: 36 }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: 11,
            fontWeight: 700,
            color: '#c084fc',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          {invite?.relationshipType?.replace(/_/g, ' ')}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 8 }}>You're Invited!</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          You've been invited to join <span style={{ color: 'white', fontWeight: 700 }}>{invite?.relationshipName}</span>{' '}
          on Couple Universe as a <span style={{ color: '#c084fc', fontWeight: 700 }}>{invite?.targetRole}</span>.
        </p>

        {/* Details */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '16px 20px',
            textAlign: 'left',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Relationship</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{invite?.relationshipName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Your Role</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#c084fc' }}>{invite?.targetRole}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Expires</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>
              {invite?.expiresAt
                ? new Date(invite.expiresAt).getFullYear() > 2100
                  ? 'Never'
                  : new Date(invite.expiresAt).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleAcceptInvite}
          style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 14 }}
        >
          Accept Invite & Create Account
        </button>
        <p style={{ marginTop: 14, fontSize: 12, color: '#475569' }}>
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            Sign in instead
          </button>
        </p>
      </div>
    </div>
  );
};

export default InviteRegistrationResolver;
