import { describe, it, expect, vi } from 'vitest';
import { parseSorobanTransferEvent } from '../../lib/soroban';

describe('Soroban RPC Event Utilities', () => {
  it('should return null when event payload is invalid or missing topics', () => {
    expect(parseSorobanTransferEvent(null)).toBeNull();
    expect(parseSorobanTransferEvent({})).toBeNull();
    expect(parseSorobanTransferEvent({ topic: [] })).toBeNull();
  });

  it('should parse valid Soroban contract transfer event', () => {
    const mockEvent = {
      contractId: 'CA3D525ZJGCS2JA7SXG5E5Z265WJCCAKTHR5EEXY355E55E55E55E55E',
      topic: ['transfer'],
      value: {
        from: 'GBRPYHIL2CI3FNQ4BXLFMNDLFPPPU2HY4ZDM4T6VKFZ4MVEXDHJA5W5T',
        to: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSFMG4BVI',
        amount: 500000000,
      },
    };

    const parsed = parseSorobanTransferEvent(mockEvent);
    expect(parsed).not.toBeNull();
    expect(parsed?.contractId).toBe(mockEvent.contractId);
    expect(parsed?.topic).toBe('transfer');
    expect(parsed?.from).toBe(mockEvent.value.from);
    expect(parsed?.to).toBe(mockEvent.value.to);
    expect(parsed?.amount).toBe('500000000');
  });
});
