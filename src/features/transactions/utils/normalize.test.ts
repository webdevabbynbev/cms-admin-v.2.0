import { describe, it, expect } from 'vitest';
import { normalizeTransaction } from './normalize';

describe('normalizeTransaction', () => {
  it('returns defaults for empty object', () => {
    const result = normalizeTransaction({});
    expect(result).toEqual({
      id: 0,
      transactionNumber: '',
      transactionStatus: '',
      failureSource: null,
      amount: 0,
      createdAt: null,
      user: null,
      shipments: [],
      details: [],
    });
  });

  it('reads camelCase top-level fields', () => {
    const result = normalizeTransaction({
      id: 101,
      transactionNumber: 'TRX-001',
      transactionStatus: 'paid',
      failureSource: null,
      amount: 250000,
      createdAt: '2026-04-01T10:00:00+07:00',
    });
    expect(result.id).toBe(101);
    expect(result.transactionNumber).toBe('TRX-001');
    expect(result.transactionStatus).toBe('paid');
    expect(result.amount).toBe(250000);
    expect(result.createdAt).toBe('2026-04-01T10:00:00+07:00');
  });

  it('reads snake_case fallbacks at top level', () => {
    const result = normalizeTransaction({
      transaction_number: 'TRX-002',
      transaction_status: 'pending',
      failure_source: 'midtrans',
      created_at: '2026-04-02',
    });
    expect(result.transactionNumber).toBe('TRX-002');
    expect(result.transactionStatus).toBe('pending');
    expect(result.failureSource).toBe('midtrans');
    expect(result.createdAt).toBe('2026-04-02');
  });

  it('coerces numeric id/amount from strings', () => {
    const result = normalizeTransaction({ id: '7', amount: '99999' });
    expect(result.id).toBe(7);
    expect(result.amount).toBe(99999);
  });

  it('normalizes nested user (camelCase)', () => {
    const result = normalizeTransaction({
      user: {
        id: 22,
        firstName: 'Abby',
        lastName: 'Bev',
        email: 'a@b.com',
        phoneNumber: '0812',
      },
    });
    expect(result.user).toEqual({
      id: 22,
      firstName: 'Abby',
      lastName: 'Bev',
      email: 'a@b.com',
      phoneNumber: '0812',
    });
  });

  it('normalizes nested user (snake_case)', () => {
    const result = normalizeTransaction({
      user: {
        id: 22,
        first_name: 'Abby',
        last_name: 'Bev',
        email: 'a@b.com',
        phone_number: '0812',
      },
    });
    expect(result.user).toEqual({
      id: 22,
      firstName: 'Abby',
      lastName: 'Bev',
      email: 'a@b.com',
      phoneNumber: '0812',
    });
  });

  it('user defaults null firstName/lastName/phoneNumber when missing', () => {
    const result = normalizeTransaction({
      user: { id: 1, email: 'x@y.com' },
    });
    expect(result.user).toEqual({
      id: 1,
      firstName: null,
      lastName: null,
      email: 'x@y.com',
      phoneNumber: null,
    });
  });

  it('user is null when raw.user is falsy', () => {
    expect(normalizeTransaction({ user: null }).user).toBeNull();
    expect(normalizeTransaction({ user: undefined }).user).toBeNull();
    expect(normalizeTransaction({}).user).toBeNull();
  });

  it('normalizes shipments array', () => {
    const result = normalizeTransaction({
      shipments: [
        { id: 1, resiNumber: 'JNE123', courier: 'JNE', service: 'REG' },
        { id: 2, resi_number: 'SICEPAT7', courier: 'SiCepat', service: 'SIUNT' },
      ],
    });
    expect(result.shipments).toHaveLength(2);
    expect(result.shipments[0]).toEqual({
      id: 1,
      resiNumber: 'JNE123',
      courier: 'JNE',
      service: 'REG',
    });
    expect(result.shipments[1].resiNumber).toBe('SICEPAT7');
  });

  it('shipments empty when not array', () => {
    expect(normalizeTransaction({ shipments: null }).shipments).toEqual([]);
    expect(normalizeTransaction({ shipments: 'nope' }).shipments).toEqual([]);
    expect(normalizeTransaction({}).shipments).toEqual([]);
  });

  it('shipment nullable fields default to null', () => {
    const result = normalizeTransaction({
      shipments: [{ id: 5 }],
    });
    expect(result.shipments[0]).toEqual({
      id: 5,
      resiNumber: null,
      courier: null,
      service: null,
    });
  });

  it('normalizes details array (camelCase)', () => {
    const result = normalizeTransaction({
      details: [
        {
          id: 1,
          productName: 'Tee',
          variantName: 'Red / M',
          qty: 2,
          price: 99000,
          discount: 10000,
          imageUrl: 'http://cdn/tee.jpg',
        },
      ],
    });
    expect(result.details[0]).toEqual({
      id: 1,
      productName: 'Tee',
      variantName: 'Red / M',
      qty: 2,
      price: 99000,
      discount: 10000,
      imageUrl: 'http://cdn/tee.jpg',
    });
  });

  it('normalizes details with snake_case + quantity fallback', () => {
    const result = normalizeTransaction({
      details: [
        {
          id: 2,
          product_name: 'Cap',
          variant_name: null,
          quantity: 3,
          price: 50000,
          discount: 0,
          image_url: 'http://cdn/cap.jpg',
        },
      ],
    });
    expect(result.details[0].productName).toBe('Cap');
    expect(result.details[0].qty).toBe(3);
    expect(result.details[0].imageUrl).toBe('http://cdn/cap.jpg');
    expect(result.details[0].variantName).toBeNull();
  });

  it('details empty when not array', () => {
    expect(normalizeTransaction({ details: null }).details).toEqual([]);
    expect(normalizeTransaction({}).details).toEqual([]);
  });

  it('detail productName defaults to empty string and qty/price/discount default 0', () => {
    const result = normalizeTransaction({
      details: [{ id: 9 }],
    });
    expect(result.details[0]).toEqual({
      id: 9,
      productName: '',
      variantName: null,
      qty: 0,
      price: 0,
      discount: 0,
      imageUrl: null,
    });
  });

  it('preserves failureSource string when present', () => {
    expect(normalizeTransaction({ failureSource: 'timeout' }).failureSource).toBe(
      'timeout',
    );
    expect(normalizeTransaction({ failure_source: 'gateway' }).failureSource).toBe(
      'gateway',
    );
  });
});
