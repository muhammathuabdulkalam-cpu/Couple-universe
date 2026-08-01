import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card variant="glass" className="p-8 text-center space-y-6 border-rose-500/30">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">403 Access Denied</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              You do not possess the required system role permissions to access this page.
            </p>
          </div>

          <Link to="/dashboard">
            <Button variant="cyan" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Dashboard
            </Button>
          </Link>
        </Card>
      </motion.div>
    </div>
  );
};
