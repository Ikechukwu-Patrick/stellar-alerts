import React from 'react';

interface SummaryStatsProps {
  totalPaymentsCount: number;
  totalVolumeXLM: number;
  activeWalletsCount: number;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  totalPaymentsCount,
  totalVolumeXLM,
  activeWalletsCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Volume */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl hover:border-purple-500/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Total Volume Tracked</span>
          <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            📊
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">
            {totalVolumeXLM.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm font-semibold text-purple-400">XLM</span>
        </div>
      </div>

      {/* Total Transactions */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl hover:border-blue-500/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Total Ingested Payments</span>
          <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            ⚡
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">
            {totalPaymentsCount}
          </span>
          <span className="text-xs font-semibold text-slate-400">payments</span>
        </div>
      </div>

      {/* Active Wallets */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl hover:border-emerald-500/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Monitored Wallets</span>
          <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            👛
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">
            {activeWalletsCount}
          </span>
          <span className="text-xs font-semibold text-emerald-400">active</span>
        </div>
      </div>
    </div>
  );
};
