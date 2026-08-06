import React from 'react';
import { PaymentDTO } from '@stellar-alerts/shared';

interface PaymentTableProps {
  payments: PaymentDTO[];
  isLoading: boolean;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({ payments, isLoading }) => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚡</span> Real-Time Payment Ledger
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Incoming blockchain operations ingested via Horizon stream &amp; deduplicated by transaction hash.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <div className="animate-pulse">Loading transaction records...</div>
        </div>
      ) : payments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm rounded-xl bg-slate-950/40 border border-slate-800/80">
          No payments recorded yet. Trigger a payment on Stellar Testnet to see live ingestion!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4">Sender Address</th>
                <th className="py-3.5 px-4">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                    {new Date(payment.receivedAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-400 whitespace-nowrap">
                    +{Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {payment.asset}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {payment.fromAddress ? (
                      `${payment.fromAddress.substring(0, 8)}...${payment.fromAddress.substring(48)}`
                    ) : (
                      'System / Genesis'
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${payment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors flex items-center gap-1"
                    >
                      <span>{payment.txHash.substring(0, 8)}...</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
