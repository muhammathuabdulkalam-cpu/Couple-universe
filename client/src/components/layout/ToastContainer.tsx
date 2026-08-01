import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import React from 'react';
import { useUIStore } from '../../store/uiStore.js';
import { ToastType } from '../../types/index.js';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-afzal" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  };

  const borders: Record<ToastType, string> = {
    success: 'border-emerald-500/40 bg-emerald-950/30',
    error: 'border-rose-500/40 bg-rose-950/30',
    info: 'border-afzal/40 bg-cyan-950/30',
    warning: 'border-amber-500/40 bg-amber-950/30',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${borders[toast.type]}`}
          >
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white tracking-wide">{toast.title}</h4>
              {toast.message && <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
