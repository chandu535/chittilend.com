import { describe, it, expect } from 'vitest';
import { loginSchema } from './auth';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const { error } = loginSchema.validate({
      email: 'admin@sripay.com',
      password: 'password123',
    });
    expect(error).toBeUndefined();
  });

  it('rejects invalid email', () => {
    const { error } = loginSchema.validate({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(error).toBeDefined();
    expect(error!.details[0].path).toContain('email');
  });

  it('rejects missing email', () => {
    const { error } = loginSchema.validate({
      password: 'password123',
    });
    expect(error).toBeDefined();
  });

  it('rejects short password', () => {
    const { error } = loginSchema.validate({
      email: 'admin@sripay.com',
      password: '123',
    });
    expect(error).toBeDefined();
    expect(error!.message).toContain('8 characters');
  });

  it('rejects missing password', () => {
    const { error } = loginSchema.validate({
      email: 'admin@sripay.com',
    });
    expect(error).toBeDefined();
  });
});
