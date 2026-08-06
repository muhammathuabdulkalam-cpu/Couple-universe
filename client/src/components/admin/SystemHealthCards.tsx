import React from 'react';
import { Database, Server, Cpu, HardDrive, Activity } from 'lucide-react';
import { SystemHealthData } from '../../types/admin.types';

interface SystemHealthCardsProps {
  health: SystemHealthData;
}

export const SystemHealthCards: React.FC<SystemHealthCardsProps> = ({ health }) => {
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>System Health & Node Process Metrics</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          Environment: {health.environment} (v{health.appVersion})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Health Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">MongoDB Database</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-black text-white">{health.database.status}</p>
          <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Latency ~{health.database.latencyMs || 5}ms
          </p>
        </div>

        {/* API Health Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">API Gateway</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-black text-white">{health.api.status}</p>
          <p className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Express Core v1.0.0
          </p>
        </div>

        {/* Server Memory Usage */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Process Memory</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-black text-white">{health.memory.heapUsedMb} MB</p>
          <p className="text-[10px] text-amber-400 font-semibold">
            Heap: {health.memory.formatted}
          </p>
        </div>

        {/* Server Uptime */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Server Uptime</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-lg font-black text-white">{formatUptime(health.server.uptimeSeconds)}</p>
          <p className="text-[10px] text-rose-400 font-semibold">
            Status: {health.server.status}
          </p>
        </div>
      </div>

      {/* Real Storage Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center gap-3 text-slate-400 text-xs">
        <HardDrive className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="font-medium">{health.storageNotice}</span>
      </div>
    </div>
  );
};
