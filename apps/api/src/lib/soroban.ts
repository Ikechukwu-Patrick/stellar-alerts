import * as StellarSdk from 'stellar-sdk';

const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

export const sorobanServer = new (StellarSdk as any).rpc.Server(SOROBAN_RPC_URL);

export interface ParsedSorobanTransfer {
  contractId: string;
  from: string;
  to: string;
  amount: string;
  topic: string;
}

/**
 * Fetches latest ledger sequence from Soroban RPC endpoint.
 */
export async function getSorobanLatestLedger(): Promise<number> {
  try {
    const health = await sorobanServer.getLatestLedger();
    return health.sequence;
  } catch (error: any) {
    console.warn(`[SorobanRPC] Could not fetch latest ledger: ${error.message}`);
    return 0;
  }
}

/**
 * Fetches contract events from Soroban RPC for a specific contract address.
 */
export async function fetchContractEvents(
  contractId: string,
  startLedger: number
): Promise<any[]> {
  try {
    const response = await sorobanServer.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [contractId],
        },
      ],
    });
    return response.events || [];
  } catch (error: any) {
    console.error(`[SorobanRPC] Error fetching contract events for ${contractId}:`, error.message);
    return [];
  }
}

/**
 * Parses raw Soroban RPC event data into a clean transfer object.
 */
export function parseSorobanTransferEvent(event: any): ParsedSorobanTransfer | null {
  if (!event || !event.topic || event.topic.length === 0) {
    return null;
  }

  const contractId = event.contractId || '';
  const topic = event.topic[0] || '';

  // Extract from, to, amount if structured payload exists
  const value = event.value || {};
  const from = value.from || value.transfer?.from || '';
  const to = value.to || value.transfer?.to || '';
  const amount = value.amount ? String(value.amount) : '0';

  return {
    contractId,
    from,
    to,
    amount,
    topic,
  };
}
