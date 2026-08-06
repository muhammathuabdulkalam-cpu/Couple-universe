import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  Heart,
  Layers,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../api/axiosClient.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { useUIStore } from '../store/uiStore.js';
import { ApiResponse, HealthStatus } from '../types/index.js';

export const HealthDashboardPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Fetch Health Status via React Query
  const { data: healthData, isLoading, isError, refetch, isRefetching } = useQuery<HealthStatus>({
    queryKey: ['healthStatus'],
    queryFn: async () => {
      const startTime = performance.now();
      const response = await axiosClient.get<ApiResponse<HealthStatus>>('/health');
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      return response.data.data!;
    },
    refetchInterval: 10000, // Auto refresh every 10 seconds
  });

  const handleTestPing = async () => {
    try {
      const startTime = performance.now();
      await axiosClient.get<ApiResponse<HealthStatus>>('/health');
      const endTime = performance.now();
      const ping = Math.round(endTime - startTime);
      setLatencyMs(ping);
      addToast(
        'API Diagnostics Passed',
        `Successfully reached backend endpoint in ${ping}ms. System healthy.`,
        'success'
      );
      refetch();
    } catch (err: any) {
      addToast('Diagnostics Failed', err.message || 'Unable to ping server', 'error');
    }
  };

  const handleTest404Error = async () => {
    try {
      await axiosClient.get('/non-existent-route-test');
    } catch (err: any) {
      addToast(
        `Global Error Handler Catch [${err.statusCode || 404}]`,
        err.message || 'Route not found error handled cleanly by AppError pipeline.',
        'warning'
      );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-8 relative overflow-hidden border border-white/10"
      >
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-gradient-to-tr from-afzal/20 via-amrin/20 to-heart/20 rounded-full blur-3xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan" size="sm">
                <Zap className="w-3 h-3" /> System Architecture Online
              </Badge>
              <Badge variant="violet" size="sm">
                TypeScript MERN
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Couple Universe <span className="gradient-text-couple">❤️ Private Platform</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed">
              Enterprise digital life repository engineered for <strong className="text-slate-200">Afzal & Amrin</strong>. 
              Preserving our journey from <strong className="text-amrin-glow">March 26, 2026</strong> across a lifetime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="cyan"
              onClick={handleTestPing}
              isLoading={isRefetching}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Ping Diagnostics
            </Button>
            <Button
              variant="glass"
              onClick={handleTest404Error}
              leftIcon={<Activity className="w-4 h-4" />}
            >
              Test Error Catch
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Relationship Counter Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass" className="border-heart/20 relative overflow-hidden bg-gradient-to-r from-obsidian-900 via-obsidian-850 to-obsidian-900">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-heart/10 border border-heart/30 flex items-center justify-center shrink-0">
                <Heart className="w-7 h-7 text-heart fill-heart animate-pulse" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-heart-glow">
                  Togetherness Meter
                </span>
                <h3 className="text-xl font-bold text-white">Afzal & Amrin's Journey</h3>
                <p className="text-xs text-slate-400">Started: March 26, 2026</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-14" />
                <Skeleton className="w-20 h-14" />
                <Skeleton className="w-20 h-14" />
              </div>
            ) : healthData ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="glass-panel px-4 py-2 rounded-xl">
                  <div className="text-2xl sm:text-3xl font-extrabold text-afzal-glow">
                    {healthData.relationshipTimeline?.togetherness.days ?? '—'}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Days</div>
                </div>
                <div className="glass-panel px-4 py-2 rounded-xl">
                  <div className="text-2xl sm:text-3xl font-extrabold text-amrin-glow">
                    {healthData.relationshipTimeline?.togetherness.hours ?? '—'}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Hours</div>
                </div>
                <div className="glass-panel px-4 py-2 rounded-xl">
                  <div className="text-2xl sm:text-3xl font-extrabold text-heart-glow">
                    {healthData.relationshipTimeline?.togetherness.minutes ?? '—'}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Mins</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Syncing timeline...
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Grid of Diagnostic Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Express API Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card hoverEffect className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-afzal/10 text-afzal">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white">Express API Core</h3>
              </div>
              {isLoading ? (
                <Skeleton className="w-16 h-6" />
              ) : isError ? (
                <Badge variant="rose">Offline</Badge>
              ) : (
                <Badge variant="green" pulse>Healthy</Badge>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                <span className="text-slate-400">Response Latency:</span>
                <span className="font-mono text-afzal-glow font-bold">{latencyMs !== null ? `${latencyMs} ms` : 'Measuring...'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                <span className="text-slate-400">Node Runtime:</span>
                <span className="font-mono text-white">{healthData?.system.nodeVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                <span className="text-slate-400">Environment:</span>
                <span className="font-mono text-amrin-glow uppercase">{healthData?.app.environment || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-300">
                <span className="text-slate-400">Server Uptime:</span>
                <span className="font-mono text-slate-200">{healthData ? `${healthData.app.uptimeSeconds}s` : 'N/A'}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* MongoDB Database Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card hoverEffect className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amrin/10 text-amrin">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white">MongoDB Atlas</h3>
              </div>
              {isLoading ? (
                <Skeleton className="w-16 h-6" />
              ) : healthData?.database.status === 'connected' ? (
                <Badge variant="violet" pulse>Connected</Badge>
              ) : (
                <Badge variant="amber">Standby</Badge>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                <span className="text-slate-400">Database Name:</span>
                <span className="font-mono text-amrin-glow font-bold">{healthData?.database.name || 'afrin_universe'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                <span className="text-slate-400">Connection State:</span>
                <span className="font-mono text-slate-200 capitalize">{healthData?.database.status || 'Ready'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                <span className="text-slate-400">ORM Framework:</span>
                <span className="font-mono text-white">Mongoose 8.x</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-300">
                <span className="text-slate-400">Schema Validation:</span>
                <span className="font-mono text-emerald-400">Strict TypeScript</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* System Memory & Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card hoverEffect className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-heart/10 text-heart">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white">System Memory</h3>
              </div>
              <Badge variant="green" size="sm">Optimal</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1 text-slate-300">
                  <span className="text-slate-400">Heap Used:</span>
                  <span className="font-mono text-white">{healthData?.system.memoryUsage.heapUsedMB || 0} MB</span>
                </div>
                <div className="w-full h-1.5 bg-obsidian-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-afzal to-amrin transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((healthData?.system.memoryUsage.heapUsedMB || 10) / (healthData?.system.memoryUsage.heapTotalMB || 100)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                <span className="text-slate-400">Heap Total:</span>
                <span className="font-mono text-slate-200">{healthData?.system.memoryUsage.heapTotalMB || 0} MB</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-300">
                <span className="text-slate-400">RSS Process Memory:</span>
                <span className="font-mono text-slate-200">{healthData?.system.memoryUsage.rssMB || 0} MB</span>
              </div>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Architecture Modules Progress Roadmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card variant="solid">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-afzal/10 text-afzal">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Enterprise Module Delivery Status</h3>
              <p className="text-xs text-slate-400">Strict module-by-module delivery architecture</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="glass-card p-4 rounded-xl border-emerald-500/30 bg-emerald-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400">Module 1</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-semibold text-white">Core Setup</h4>
              <p className="text-[11px] text-slate-400 mt-1">Express, Vite, TS, Tailwind, Health API</p>
            </div>

            <div className="glass-card p-4 rounded-xl opacity-60 border-amrin/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amrin-glow">Module 2</span>
                <Clock className="w-4 h-4 text-amrin-glow" />
              </div>
              <h4 className="text-sm font-semibold text-white">Auth & RBAC</h4>
              <p className="text-[11px] text-slate-400 mt-1">Dual JWT, HttpOnly Cookies, Afzal/Amrin Roles</p>
            </div>

            <div className="glass-card p-4 rounded-xl opacity-40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Module 3</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Cloudinary Vault</h4>
              <p className="text-[11px] text-slate-400 mt-1">Multer stream, media upload, profiles</p>
            </div>

            <div className="glass-card p-4 rounded-xl opacity-40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Module 4</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Socket.io Gateway</h4>
              <p className="text-[11px] text-slate-400 mt-1">Real-time alerts, live presence</p>
            </div>

            <div className="glass-card p-4 rounded-xl opacity-40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Module 5</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Admin Hub</h4>
              <p className="text-[11px] text-slate-400 mt-1">Metrics, audit log & future modules</p>
            </div>

          </div>
        </Card>
      </motion.div>

    </div>
  );
};
