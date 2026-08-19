import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { CreateUserFormData, UpdateUserFormData } from '../../types/admin.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    phone?: string;
    bio?: string;
    birthday?: string;
    avatar?: string;
  } | null;
}

const ROLES = ['INVITED_USER', 'MEMBER', 'CO_OWNER', 'SUPER_OWNER'];
const STATUSES = ['ACTIVE', 'SUSPENDED', 'PENDING'];

const UserModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, editingUser }) => {
  const isEditing = !!editingUser;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    birthday: '',
    gender: '',
    role: 'INVITED_USER',
    status: 'ACTIVE',
    bio: '',
    avatar: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setForm({
          name: editingUser.name || '',
          email: editingUser.email || '',
          password: '',
          phone: editingUser.phone || '',
          birthday: editingUser.birthday || '',
          gender: '',
          role: editingUser.role || 'USER',
          status: editingUser.status || 'ACTIVE',
          bio: editingUser.bio || '',
          avatar: editingUser.avatar || '',
        });
      } else {
        setForm({ name: '', email: '', password: '', phone: '', birthday: '', gender: '', role: 'USER', status: 'ACTIVE', bio: '', avatar: '' });
      }
      setError('');
    }
  }, [isOpen, editingUser]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        const updateData: UpdateUserFormData = {
          name: form.name || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          birthday: form.birthday || undefined,
          gender: form.gender || undefined,
          bio: form.bio || undefined,
          avatar: form.avatar || undefined,
          role: form.role as any,
          status: form.status as any,
        };
        await adminApi.updateUser(editingUser!.id, updateData);
      } else {
        const createData: CreateUserFormData = {
          displayName: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          birthday: form.birthday || undefined,
          gender: form.gender || undefined,
          bio: form.bio || undefined,
          avatar: form.avatar || undefined,
          role: form.role as any,
          status: form.status as any,
        };
        await adminApi.createUser(createData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="admin-modal-icon" style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h2 className="admin-modal-title">{isEditing ? 'Edit User' : 'Create User'}</h2>
            <p className="admin-modal-subtitle">{isEditing ? `Editing ${editingUser?.email}` : 'Add a new user to the platform'}</p>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form className="admin-modal-body" onSubmit={handleSubmit}>
          {error && <div className="admin-modal-error">{error}</div>}

          <div className="admin-form-grid">
            <div className="admin-form-group full-width">
              <label className="admin-form-label">Full Name *</label>
              <input className="admin-form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. John Doe" required={!isEditing} />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Email *</label>
              <input className="admin-form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="user@example.com" required={!isEditing} />
            </div>

            {!isEditing && (
              <div className="admin-form-group">
                <label className="admin-form-label">Password *</label>
                <input className="admin-form-input" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required={!isEditing} />
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-form-label">Phone</label>
              <input className="admin-form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+1234567890" />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Birthday</label>
              <input className="admin-form-input" name="birthday" type="date" value={form.birthday} onChange={handleChange} />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Gender</label>
              <select className="admin-form-input" name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-Binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer Not to Say</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Role *</label>
              <select className="admin-form-input" name="role" value={form.role} onChange={handleChange} required>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Status</label>
              <select className="admin-form-input" name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-form-label">Bio</label>
              <textarea className="admin-form-input admin-form-textarea" name="bio" value={form.bio} onChange={handleChange} placeholder="A short bio..." rows={3} />
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-form-label">Avatar URL</label>
              <input className="admin-form-input" name="avatar" value={form.avatar} onChange={handleChange} placeholder="https://example.com/avatar.jpg" />
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
              {loading ? (
                <><span className="admin-btn-spinner" />{isEditing ? 'Updating...' : 'Creating...'}</>
              ) : (
                isEditing ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
