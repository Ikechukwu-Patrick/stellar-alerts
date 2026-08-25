import React from 'react';
import { PaymentDTO } from '@stellar-alerts/shared';

interface PaymentTableProps {
  payments: PaymentDTO[];
  isLoading: boolean;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({ payments, isLoading }) => {
  const exportToCSV = () => {
    if (!payments || payments.length === 0) return;

    const headers = ['ID', 'Wallet ID', 'Tx Hash', 'From Address', 'Amount', 'Asset', 'Memo', 'Received At'];
    const rows = payments.map((p) => [
      p.id,
      p.walletId,
      p.txHash,
      p.fromAddress || '',
      p.amount,
      p.asset,
      p.memo || '',
      new Date(p.receivedAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((field) => {
            const stringified = String(field ?? '');
            if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
              return `"${stringified.replace(/"/g, '""')}"`;
            }
            return stringified;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stellar-payments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!payments || payments.length === 0) return;

    const jsonContent = JSON.stringify(payments, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stellar-payments.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚡</span> Real-Time Payment Ledger
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Incoming blockchain operations ingested via Horizon stream &amp; deduplicated by transaction hash.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={payments.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md cursor-pointer"
            title="Download payments as CSV file"
          >
            <span>📥</span> Export CSV
          </button>
          <button
            onClick={exportToJSON}
            disabled={payments.length === 0}
            className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md cursor-pointer"
            title="Download payments as JSON file"
          >
            <span>📄</span> Export JSON
          </button>
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
                      payment.fromAddress.length > 20
                        ? `${payment.fromAddress.substring(0, 8)}...${payment.fromAddress.substring(payment.fromAddress.length - 8)}`
                        : payment.fromAddress
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
