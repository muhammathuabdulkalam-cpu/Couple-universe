import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { RELATIONSHIP_TYPES } from '../../constants/relationshipTypes';
import { CreateRelationshipFormData, UpdateRelationshipFormData } from '../../types/admin.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRelationship?: {
    id: string;
    name: string;
    type: string;
    coverImage?: string;
    startDate?: string;
    status?: string;
    description?: string;
  } | null;
}

const STATUSES = ['ACTIVE', 'ARCHIVED'];

const RelationshipModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, editingRelationship }) => {
  const isEditing = !!editingRelationship;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: 'ROMANTIC_COUPLE',
    coverImage: '',
    startDate: '',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (isOpen) {
      if (editingRelationship) {
        setForm({
          name: editingRelationship.name || '',
          type: editingRelationship.type || 'ROMANTIC_COUPLE',
          coverImage: editingRelationship.coverImage || '',
          startDate: editingRelationship.startDate ? editingRelationship.startDate.split('T')[0] : '',
          description: editingRelationship.description || '',
          status: editingRelationship.status || 'ACTIVE',
        });
      } else {
        setForm({ name: '', type: 'ROMANTIC_COUPLE', coverImage: '', startDate: '', description: '', status: 'ACTIVE' });
      }
      setError('');
    }
  }, [isOpen, editingRelationship]);

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
        const data: UpdateRelationshipFormData = {
          name: form.name || undefined,
          type: form.type || undefined,
          coverImage: form.coverImage || undefined,
          startDate: form.startDate || undefined,
          description: form.description || undefined,
          status: form.status as any,
        };
        await adminApi.updateRelationship(editingRelationship!.id, data);
      } else {
        const data: CreateRelationshipFormData = {
          name: form.name,
          type: form.type,
          coverImage: form.coverImage || undefined,
          startDate: form.startDate || undefined,
          description: form.description || undefined,
          status: form.status as any,
        };
        await adminApi.createRelationship(data);
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
      <div className="admin-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="admin-modal-header">
          <div className="admin-modal-icon" style={{ background: 'linear-gradient(135deg, #EC4899, #F43F5E)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <h2 className="admin-modal-title">{isEditing ? 'Edit Relationship' : 'Create Relationship'}</h2>
            <p className="admin-modal-subtitle">{isEditing ? `Editing "${editingRelationship?.name}"` : 'Create a new couple/relationship'}</p>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="admin-modal-body" onSubmit={handleSubmit}>
          {error && <div className="admin-modal-error">{error}</div>}

          <div className="admin-form-grid">
            <div className="admin-form-group full-width">
              <label className="admin-form-label">Relationship Name *</label>
              <input className="admin-form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. John & Jane" required />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Type *</label>
              <select className="admin-form-input" name="type" value={form.type} onChange={handleChange} required>
                {Object.values(RELATIONSHIP_TYPES).map((t: string) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Status</label>
              <select className="admin-form-input" name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-form-label">Start Date</label>
              <input className="admin-form-input" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-form-label">Cover Image URL</label>
              <input className="admin-form-input" name="coverImage" value={form.coverImage} onChange={handleChange} placeholder="https://example.com/cover.jpg" />
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-form-label">Description</label>
              <textarea className="admin-form-input admin-form-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Optional description..." rows={3} />
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
              {loading ? (
                <><span className="admin-btn-spinner" />{isEditing ? 'Updating...' : 'Creating...'}</>
              ) : (
                isEditing ? 'Update Relationship' : 'Create Relationship'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RelationshipModal;
