import { prisma } from '../lib/prisma';
import { stellar } from '../lib/stellar';

export async function processWalletPayments(wallet: { id: string; publicKey: string }) {
  if (!wallet.publicKey || wallet.publicKey.length !== 56 || !wallet.publicKey.startsWith('G')) {
    console.warn(`[WatcherWorker] Skipping invalid public key format: "${wallet.publicKey}"`);
    return;
  }

  const records = await stellar.getRecentPayments(wallet.publicKey, 10);

  for (const record of records as any[]) {
    let amount: string | undefined;
    let asset: string = 'XLM';
    let fromAddress: string = '';
    const txHash: string = record.transaction_hash;
    const receivedAt: Date = new Date(record.created_at);

    if (record.type === 'payment') {
      amount = record.amount;
      asset = record.asset_type === 'native' ? 'XLM' : (record.asset_code || 'Unknown');
      fromAddress = record.from || '';
    } else if (record.type === 'create_account') {
      amount = record.starting_balance;
      asset = 'XLM';
      fromAddress = record.funder || '';
    }

    if (!amount || !txHash) continue;

    // Deduplicate check
    const existing = await prisma.payment.findUnique({ where: { txHash } });
    if (!existing) {
      console.log(`[WatcherWorker] 💰 New ${record.type} detected for wallet (${wallet.publicKey.substring(0, 8)}...): ${amount} ${asset}`);
      await prisma.payment.create({
        data: {
          walletId: wallet.id,
          txHash,
          fromAddress,
          amount: Number(amount),
          asset,
          receivedAt,
        },
      });
    }
  }
}

export async function runWatcher() {
  console.log('[WatcherWorker] 🚀 Starting Stellar Testnet Watcher Worker...');

  const poll = async () => {
    try {
      const wallets = await prisma.wallet.findMany();
      if (wallets.length === 0) {
        console.log('[WatcherWorker] No wallets registered in DB to watch. Waiting for next poll...');
        return;
      }

      console.log(`[WatcherWorker] Checking ${wallets.length} registered wallet(s)...`);
      for (const wallet of wallets) {
        await processWalletPayments(wallet);
      }
    } catch (error) {
      console.error('[WatcherWorker] Polling error:', error);
    }
  };

  // Immediate first run
  await poll();

  // Poll every 10 seconds
  setInterval(poll, 10000);
}

if (require.main === module) {
  runWatcher();
}

