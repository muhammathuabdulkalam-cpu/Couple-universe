import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X, Bell } from 'lucide-react';
import React from 'react';
import { useUIStore } from '../../store/uiStore.js';
import { ToastType } from '../../types/index.js';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-pink-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  };

  const badgeGradients: Record<ToastType, string> = {
    success: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    error: 'from-rose-500 to-pink-600 shadow-rose-500/20',
    info: 'from-rose-500 via-pink-500 to-purple-600 shadow-pink-500/20',
    warning: 'from-amber-500 to-orange-600 shadow-amber-500/20',
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 sm:top-5 sm:right-6 sm:left-auto sm:translate-x-0 z-[9999] flex flex-col gap-2.5 w-[94%] sm:w-[380px] max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_e, info) => {
              // Swipe left/right by >50px or swipe up by <-30px dismisses the push notification
              if (Math.abs(info.offset.x) > 50 || info.offset.y < -30) {
                removeToast(toast.id);
              }
            }}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="pointer-events-auto relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 p-3.5 shadow-2xl shadow-black/80 text-white flex flex-col select-none touch-pan-y cursor-grab active:cursor-grabbing group transition-all"
          >
            {/* Top Swipable Pull Bar Indicator */}
            <div className="w-8 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-2 group-hover:bg-white/40 transition-colors" />

            <div className="flex items-start gap-3">
              {/* App / Notification Icon Badge */}
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badgeGradients[toast.type]} flex items-center justify-center shrink-0 shadow-lg`}>
                {icons[toast.type]}
              </div>

              {/* Push Notification Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                    <Bell className="w-2.5 h-2.5" /> Couple Universe
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">now</span>
                </div>

                <h4 className="text-xs font-extrabold text-white tracking-tight mt-0.5 leading-snug">
                  {toast.title}
                </h4>

                {toast.message && (
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-tight line-clamp-2">
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Close / Dismiss Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
