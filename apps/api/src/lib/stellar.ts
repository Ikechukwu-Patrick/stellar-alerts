import * as StellarSdk from 'stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

export const stellar = {
  server,
  // Helper to fetch recent payments for a given account
  async getRecentPayments(publicKey: string, limit: number = 10) {
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith('G')) {
      console.warn(`[Stellar] Skipping invalid public key format: "${publicKey}"`);
      return [];
    }

    try {
      const payments = await server.payments()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call();
      
      return payments.records;
    } catch (error) {
      console.error(`[Stellar] Error fetching payments for ${publicKey}:`, error);
      return [];
    }
  }
};
