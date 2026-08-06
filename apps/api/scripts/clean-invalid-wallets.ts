import { prisma } from '../src/lib/prisma';
import * as StellarSdk from 'stellar-sdk';

async function main() {
  console.log('[Cleanup] 🧹 Scanning database for invalid Stellar public keys...');
  const wallets = await prisma.wallet.findMany();

  let removedCount = 0;
  for (const wallet of wallets) {
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(wallet.publicKey)) {
      console.log(`[Cleanup] Removing invalid wallet ID ${wallet.id} (${wallet.publicKey})`);
      await prisma.wallet.delete({ where: { id: wallet.id } });
      removedCount++;
    }
  }

  console.log(`[Cleanup] ✅ Removed ${removedCount} invalid wallet(s) from database.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[Cleanup] Error:', err);
  process.exit(1);
});
