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
          <Activity className="w-4 h-4 text-indigo-400" />
          <span>System Health & Node Process Metrics</span>
        </h3>
        <span className="text-[10px] text-slate-300 font-bold px-3 py-1 rounded-full bg-[#16161E] border border-white/10">
          Environment: {health.environment} (v{health.appVersion})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Health Card */}
        <div className="p-5 rounded-3xl bg-[#16161E] border border-white/5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-400">MongoDB Database</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white">{health.database.status}</p>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Latency ~{health.database.latencyMs || 5}ms
          </p>
        </div>

        {/* API Health Card */}
        <div className="p-5 rounded-3xl bg-[#16161E] border border-white/5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-400">API Gateway</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white">{health.api.status}</p>
          <p className="text-[10px] text-indigo-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Express Core v1.0.0
          </p>
        </div>

        {/* Server Memory Usage */}
        <div className="p-5 rounded-3xl bg-[#16161E] border border-white/5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-400">Process Memory</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white">{health.memory.heapUsedMb} MB</p>
          <p className="text-[10px] text-amber-400 font-bold">
            Heap: {health.memory.formatted}
          </p>
        </div>

        {/* Server Uptime */}
        <div className="p-5 rounded-3xl bg-[#16161E] border border-white/5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-400">Server Uptime</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white">{formatUptime(health.server.uptimeSeconds)}</p>
          <p className="text-[10px] text-indigo-400 font-bold">
            Status: {health.server.status}
          </p>
        </div>
      </div>

      {/* Storage Banner */}
      <div className="p-4 rounded-3xl bg-[#16161E] border border-white/5 flex items-center gap-3 text-slate-300 text-xs font-medium">
        <HardDrive className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="font-semibold">{health.storageNotice}</span>
      </div>
    </div>
  );
};
