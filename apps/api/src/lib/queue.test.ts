import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Job, QueueEvents } from 'bullmq';

// We mock bullmq before importing queue
vi.mock('bullmq', () => {
  const addMock = vi.fn().mockResolvedValue(true);
  const onMock = vi.fn();
  
  return {
    Queue: vi.fn().mockImplementation(() => {
      return {
        add: addMock,
      };
    }),
    QueueEvents: vi.fn().mockImplementation(() => {
      return {
        on: onMock,
      };
    }),
    Job: {
      fromId: vi.fn(),
    },
  };
});

import { alertQueue, dlqQueue, alertQueueEvents } from './queue';

describe('Queue DLQ routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes to DLQ when job fails after max attempts', async () => {
    const onCall = (alertQueueEvents as any).on.mock.calls.find((call: any[]) => call[0] === 'failed');
    expect(onCall).toBeDefined();

    const failedHandler = onCall[1];

    (Job.fromId as any).mockResolvedValue({
      attemptsMade: 5,
      opts: { attempts: 5 },
      data: { txHash: 'test-tx' },
    });

    await failedHandler({ jobId: '123', failedReason: 'Test error' });

    expect(dlqQueue?.add).toHaveBeenCalledWith(
      'dispatch-alert-failed',
      { txHash: 'test-tx' },
      { jobId: 'dlq-123' }
    );
  });
  
  it('does not route to DLQ if attempts < max attempts', async () => {
    const onCall = (alertQueueEvents as any).on.mock.calls.find((call: any[]) => call[0] === 'failed');
    const failedHandler = onCall[1];

    (Job.fromId as any).mockResolvedValue({
      attemptsMade: 3,
      opts: { attempts: 5 },
      data: { txHash: 'test-tx' },
    });

    await failedHandler({ jobId: '124', failedReason: 'Test error' });

    expect(dlqQueue?.add).not.toHaveBeenCalled();
  });
});
