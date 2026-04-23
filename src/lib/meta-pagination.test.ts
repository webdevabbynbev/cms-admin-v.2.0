import { describe, it, expect } from 'vitest';
import { toPaginated, type MetaPaginatedResponse } from './meta-pagination';

describe('toPaginated', () => {
  it('maps meta fields to AdonisPaginatedPayload shape', () => {
    const response: MetaPaginatedResponse<{ id: number }> = {
      meta: {
        total: 100,
        perPage: 10,
        currentPage: 2,
        lastPage: 10,
        firstPage: 1,
      },
      data: [{ id: 1 }, { id: 2 }],
    };

    expect(toPaginated(response)).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      total: 100,
      perPage: 10,
      currentPage: 2,
      lastPage: 10,
      firstPage: 1,
    });
  });

  it('drops extra meta fields (firstPageUrl, nextPageUrl, etc.)', () => {
    const response: MetaPaginatedResponse<number> = {
      meta: {
        total: 0,
        perPage: 10,
        currentPage: 1,
        lastPage: 1,
        firstPage: 1,
        firstPageUrl: 'https://x/1',
        lastPageUrl: 'https://x/1',
        nextPageUrl: null,
        previousPageUrl: null,
      },
      data: [],
    };

    const result = toPaginated(response);
    expect(result).toEqual({
      data: [],
      total: 0,
      perPage: 10,
      currentPage: 1,
      lastPage: 1,
      firstPage: 1,
    });
    expect(result).not.toHaveProperty('firstPageUrl');
    expect(result).not.toHaveProperty('nextPageUrl');
  });

  it('preserves empty data array', () => {
    const response: MetaPaginatedResponse<string> = {
      meta: { total: 0, perPage: 20, currentPage: 1, lastPage: 1, firstPage: 1 },
      data: [],
    };
    expect(toPaginated(response).data).toEqual([]);
  });

  it('preserves data reference (not deep-cloned)', () => {
    const data = [{ id: 1 }];
    const response: MetaPaginatedResponse<{ id: number }> = {
      meta: { total: 1, perPage: 10, currentPage: 1, lastPage: 1, firstPage: 1 },
      data,
    };
    expect(toPaginated(response).data).toBe(data);
  });
});
