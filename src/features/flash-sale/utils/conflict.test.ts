import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { parseFlashSaleConflict } from './conflict';

function make409(data: unknown): AxiosError {
  const err = new AxiosError('Conflict');
  err.response = {
    data,
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

function makeResponseStatus(data: unknown, status: number): AxiosError {
  const err = new AxiosError('Error');
  err.response = {
    data,
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe('parseFlashSaleConflict', () => {
  it('returns null for non-axios errors', () => {
    expect(parseFlashSaleConflict(new Error('generic'))).toBeNull();
    expect(parseFlashSaleConflict(null)).toBeNull();
    expect(parseFlashSaleConflict('string')).toBeNull();
  });

  it('returns null for axios errors that are not 409', () => {
    expect(parseFlashSaleConflict(makeResponseStatus({ message: 'x' }, 400))).toBeNull();
    expect(parseFlashSaleConflict(makeResponseStatus({ message: 'x' }, 500))).toBeNull();
  });

  it('returns null when 409 body has no conflict fields and no conflict code', () => {
    expect(parseFlashSaleConflict(make409({ message: 'other conflict' }))).toBeNull();
  });

  it('parses {serve: {code, conflicts}} shape with full variant objects', () => {
    const err = make409({
      message: 'Konflik dengan promo lain',
      serve: {
        code: 'DISCOUNT_CONFLICT',
        conflicts: [
          { variant_id: 101, product_name: 'Lip Tint', promo_name: 'Voucher A' },
          { variant_id: 102, product_id: 22, product: { name: 'Mascara' } },
        ],
      },
    });

    const result = parseFlashSaleConflict(err);
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Konflik dengan promo lain');
    expect(result?.conflicts).toEqual([
      {
        variantId: 101,
        productId: null,
        productName: 'Lip Tint',
        promoName: 'Voucher A',
        message: null,
      },
      {
        variantId: 102,
        productId: 22,
        productName: 'Mascara',
        promoName: null,
        message: null,
      },
    ]);
  });

  it('accepts FLASH_SALE_CONFLICT and PROMO_CONFLICT codes', () => {
    expect(
      parseFlashSaleConflict(
        make409({ serve: { code: 'FLASH_SALE_CONFLICT', conflicts: [{ variant_id: 1 }] } }),
      )?.conflicts,
    ).toHaveLength(1);
    expect(
      parseFlashSaleConflict(
        make409({ serve: { code: 'PROMO_CONFLICT', conflicts: [{ variant_id: 1 }] } }),
      )?.conflicts,
    ).toHaveLength(1);
  });

  it('parses alternative field names: variants, items', () => {
    const withVariants = make409({
      serve: { variants: [{ variant_id: 5 }, { variant_id: 6 }] },
    });
    expect(parseFlashSaleConflict(withVariants)?.conflicts).toHaveLength(2);

    const withItems = make409({
      serve: { items: [{ id: 7 }] },
    });
    expect(parseFlashSaleConflict(withItems)?.conflicts).toHaveLength(1);
    expect(parseFlashSaleConflict(withItems)?.conflicts[0].variantId).toBe(7);
  });

  it('parses serve as a bare array of ids', () => {
    const result = parseFlashSaleConflict(make409({ serve: [101, '102', 103] }));
    expect(result?.conflicts.map((c) => c.variantId)).toEqual([101, 102, 103]);
  });

  it('falls back to root body when no serve wrapper', () => {
    const result = parseFlashSaleConflict(
      make409({ code: 'DISCOUNT_CONFLICT', conflicts: [{ id: 99 }] }),
    );
    expect(result?.conflicts[0].variantId).toBe(99);
  });

  it('returns empty conflicts when conflict code is present but no list', () => {
    const result = parseFlashSaleConflict(
      make409({ message: 'Konflik', serve: { code: 'DISCOUNT_CONFLICT' } }),
    );
    expect(result).not.toBeNull();
    expect(result?.conflicts).toEqual([]);
    expect(result?.message).toBe('Konflik');
  });

  it('extracts variantId from nested variant.id fallback', () => {
    const result = parseFlashSaleConflict(
      make409({ serve: { conflicts: [{ variant: { id: 42 } }] } }),
    );
    expect(result?.conflicts[0].variantId).toBe(42);
  });

  it('filters out rows with no recoverable id', () => {
    const result = parseFlashSaleConflict(
      make409({ serve: { code: 'DISCOUNT_CONFLICT', conflicts: [{ garbage: true }, { variant_id: 10 }] } }),
    );
    expect(result?.conflicts).toHaveLength(1);
    expect(result?.conflicts[0].variantId).toBe(10);
  });

  it('returns null when 409 body is missing entirely', () => {
    const err = new AxiosError('Conflict');
    err.response = {
      data: undefined,
      status: 409,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    expect(parseFlashSaleConflict(err)).toBeNull();
  });

  it('reads camelCase productName/promoName fallback', () => {
    const result = parseFlashSaleConflict(
      make409({
        serve: {
          code: 'DISCOUNT_CONFLICT',
          conflicts: [{ variantId: 5, productName: 'CC Cream', promoName: 'Big Sale' }],
        },
      }),
    );
    expect(result?.conflicts[0]).toMatchObject({
      variantId: 5,
      productName: 'CC Cream',
      promoName: 'Big Sale',
    });
  });
});
