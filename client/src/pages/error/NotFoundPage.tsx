import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card variant="glass" className="p-8 text-center space-y-6 border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin-glow mx-auto">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">404 Page Not Found</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The path you requested does not exist in Afrin Universe.
            </p>
          </div>

          <Link to="/dashboard">
            <Button variant="violet" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Dashboard
            </Button>
          </Link>
        </Card>
      </motion.div>
    </div>
  );
};
