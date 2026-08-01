import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { ReportReason, ReportTargetType } from '../../types/index.js';

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  isOpen: boolean;
  onClose: () => void;
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam or Misleading' },
  { value: 'HARASSMENT', label: 'Harassment or Bullying' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'OTHER', label: 'Other Issue' },
];

export const ReportModal: React.FC<Props> = ({ targetType, targetId, isOpen, onClose }) => {
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reportMutation = useMutation({
    mutationFn: () =>
      axiosClient.post('/reports', {
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      }),
    onSuccess: () => setSubmitted(true),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/10 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white">Report Submitted</h3>
            <p className="text-xs text-slate-400">
              Thank you for keeping Afrin Verse safe. Our admin team will review this report shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-afzal to-amrin text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Report {targetType}</h3>
                <p className="text-xs text-slate-400">Why are you reporting this content?</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Reason</label>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      reason === r.value
                        ? 'bg-afzal/20 border-afzal text-white font-medium'
                        : 'glass-panel border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-afzal"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Additional Details (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details to help us understand the issue..."
                rows={3}
                className="w-full bg-obsidian-900/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-afzal/50"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reportMutation.isPending}
                onClick={() => reportMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
