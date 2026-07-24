import { describe, it, expect } from 'vitest';
import { createBorrowerSchema, updateBorrowerSchema } from './borrower';

const validBorrower = {
  name: 'Ravi Kumar',
  mobile: '9876543210',
  area: 'Hyderabad',
};

describe('createBorrowerSchema', () => {
  it('accepts valid borrower data', () => {
    const { error } = createBorrowerSchema.validate(validBorrower);
    expect(error).toBeUndefined();
  });

  it('accepts Telugu name', () => {
    const { error } = createBorrowerSchema.validate({
      ...validBorrower,
      name: 'రవి కుమార్',
    });
    expect(error).toBeUndefined();
  });

  it('rejects missing name', () => {
    const { error } = createBorrowerSchema.validate({ mobile: '9876543210' });
    expect(error).toBeDefined();
    expect(error!.details[0].path).toContain('name');
  });

  it('rejects invalid mobile (not 10 digits)', () => {
    const { error } = createBorrowerSchema.validate({
      ...validBorrower,
      mobile: '12345',
    });
    expect(error).toBeDefined();
    expect(error!.details[0].path).toContain('mobile');
  });

  it('rejects a 10-digit number that is not an Indian mobile number', () => {
    const { error } = createBorrowerSchema.validate({
      ...validBorrower,
      mobile: '1234567890',
    });
    expect(error).toBeDefined();
    expect(error!.details[0].path).toContain('mobile');
  });

  it('rejects mobile with country code', () => {
    const { error } = createBorrowerSchema.validate({
      ...validBorrower,
      mobile: '+919876543210',
    });
    expect(error).toBeDefined();
  });

  it('accepts null area', () => {
    const { error } = createBorrowerSchema.validate({
      name: 'Test',
      mobile: '9876543210',
      area: null,
    });
    expect(error).toBeUndefined();
  });

  it('validates GPS coordinates', () => {
    const { error } = createBorrowerSchema.validate({
      ...validBorrower,
      locationLat: 17.385,
      locationLng: 78.486,
    });
    expect(error).toBeUndefined();
  });

  it('rejects out-of-range latitude', () => {
    const { error } = createBorrowerSchema.validate({
      ...validBorrower,
      locationLat: 91,
    });
    expect(error).toBeDefined();
  });

  it('requires suretyReferenceId for existing_borrower surety', () => {
    const { error } = createBorrowerSchema.validate({
      ...validBorrower,
      suretyType: 'existing_borrower',
    });
    expect(error).toBeDefined();
  });

  it('accepts existing_borrower surety with reference', () => {
    const { error } = createBorrowerSchema.validate({
      ...validBorrower,
      suretyType: 'existing_borrower',
      suretyReferenceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(error).toBeUndefined();
  });
});

describe('updateBorrowerSchema', () => {
  it('allows partial updates', () => {
    const { error } = updateBorrowerSchema.validate({ area: 'New Area' });
    expect(error).toBeUndefined();
  });

  it('still validates field formats', () => {
    const { error } = updateBorrowerSchema.validate({ mobile: 'bad' });
    expect(error).toBeDefined();
  });
});
