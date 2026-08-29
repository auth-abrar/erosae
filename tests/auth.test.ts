import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../src/lib/auth';

describe('Authentication & Security Foundation', () => {
  it('should securely hash passwords and verify matching hashes', async () => {
    const password = 'StrongPassword@2026!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should sign and verify valid JWT session tokens', () => {
    const payload = {
      userId: 'usr_test_123',
      email: 'customer@erosae.com',
      name: 'Tanvir Ahmed',
      role: 'CUSTOMER',
    };

    const token = signToken(payload, '1h');
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken<typeof payload>(token);
    expect(decoded).toBeDefined();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
  });

  it('should reject tampered or invalid JWT session tokens', () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakePayload.fakeSignature';
    const decoded = verifyToken(fakeToken);
    expect(decoded).toBeNull();
  });
});
