import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Layers, Sparkles } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

interface ElegantPlaceholderPageProps {
  title: string;
  description: string;
  moduleTarget: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ElegantPlaceholderPage: React.FC<ElegantPlaceholderPageProps> = ({
  title,
  description,
  moduleTarget,
  icon: Icon,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      
      <div className="flex items-center justify-between">
        <Link to="/dashboard">
          <Button variant="glass" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
        <Badge variant="violet" size="sm">
          <Clock className="w-3 h-3" /> Scheduled for {moduleTarget}
        </Badge>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="p-12 text-center space-y-6 border-white/10 relative overflow-hidden">
          
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-gradient-to-tr from-afzal/15 via-amrin/15 to-heart/15 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 mx-auto shadow-xl">
            <div className="w-full h-full bg-obsidian-950 rounded-[22px] flex items-center justify-center text-amrin-glow">
              <Icon className="w-10 h-10" />
            </div>
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amrin-glow" />
              <span className="text-xs uppercase tracking-widest font-bold text-slate-400">Architecture Ready</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
          </div>

          <div className="glass-card p-6 rounded-2xl max-w-md mx-auto space-y-3 border-white/10 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Layers className="w-4 h-4 text-afzal" />
              <span>Module Foundation Status</span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">UI Layout Shell:</span>
                <span className="text-emerald-400 font-semibold">Ready</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Role Permissions:</span>
                <span className="text-emerald-400 font-semibold">Enforced</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Target Delivery:</span>
                <span className="text-amrin-glow font-semibold">{moduleTarget}</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link to="/dashboard">
              <Button variant="cyan" size="md">
                Return to Home Dashboard
              </Button>
            </Link>
          </div>

        </Card>
      </motion.div>

    </div>
  );
};
