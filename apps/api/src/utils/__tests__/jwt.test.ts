import { describe, it, expect, vi } from 'vitest';
import { generateMagicToken, generateSessionToken, verifyToken, MagicLinkPayload, UserPayload } from '../jwt';

// Mock env for isolated test execution
vi.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-super-secret-jwt-key-12345',
  },
}));

describe('JWT Utilities', () => {
  it('should generate and verify a valid magic link token', () => {
    const email = 'reviewer@drips.network';
    const token = generateMagicToken(email);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);

    const decoded = verifyToken<MagicLinkPayload>(token);
    expect(decoded.email).toBe(email);
  });

  it('should generate and verify a valid session token', () => {
    const userPayload: UserPayload = {
      id: 'cuid_test_user_123',
      email: 'user@stellar-alerts.org',
    };

    const token = generateSessionToken(userPayload);
    expect(typeof token).toBe('string');

    const decoded = verifyToken<UserPayload>(token);
    expect(decoded.id).toBe(userPayload.id);
    expect(decoded.email).toBe(userPayload.email);
  });

  it('should throw error when verifying an invalid token', () => {
    expect(() => verifyToken('invalid-malformed-token-string')).toThrow();
  });
});
