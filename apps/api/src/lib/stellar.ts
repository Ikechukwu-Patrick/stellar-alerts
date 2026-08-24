import * as StellarSdk from 'stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

function logPaymentsError(publicKey: string, error: any) {
  if (error?.response?.status === 404) {
    console.warn(`[Stellar] Account not found or not funded on Testnet: ${publicKey}`);
  } else if (error?.response?.status === 400) {
    console.warn(`[Stellar] Horizon 400 Bad Request for ${publicKey}: ${error?.response?.data?.detail || error.message}`);
  } else {
    console.error(`[Stellar] Error fetching payments for ${publicKey}:`, error.message || error);
  }
}

export const stellar = {
  server,
  // Helper to fetch recent payments for a given account
  async getRecentPayments(publicKey: string, limit: number = 10) {
    if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      console.warn(`[Stellar] Skipping invalid public key format or checksum: "${publicKey}"`);
      return [];
    }

    try {
      const payments = await server.payments()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call();
      
      return payments.records;
    } catch (error: any) {
      logPaymentsError(publicKey, error);
      return [];
    }
  },

  // Fetch payments recorded after the given Horizon paging token, oldest first
  async getPaymentsSince(publicKey: string, cursor: string, limit: number = 50) {
    if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      console.warn(`[Stellar] Skipping invalid public key format or checksum: "${publicKey}"`);
      return [];
    }

    try {
      const payments = await server.payments()
        .forAccount(publicKey)
        .cursor(cursor)
        .order('asc')
        .limit(limit)
        .call();

      return payments.records;
    } catch (error: any) {
      logPaymentsError(publicKey, error);
      return [];
    }
  },

  // Paging token of the most recent payment, used to seed a fresh cursor
  async getLatestPagingToken(publicKey: string): Promise<string> {
    const records = await this.getRecentPayments(publicKey, 1);
    return (records[0] as any)?.paging_token || '0';
  }
};
