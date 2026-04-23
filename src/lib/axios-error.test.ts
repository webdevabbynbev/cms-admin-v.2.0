import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { extractAxiosErrorMessage } from './axios-error';

function makeAxiosError(data: unknown, status = 400): AxiosError {
  const err = new AxiosError('Request failed');
  err.response = {
    data,
    status,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe('extractAxiosErrorMessage', () => {
  it('returns server message when axios error has response.data.message', () => {
    const err = makeAxiosError({ message: 'Email sudah terdaftar' });
    expect(extractAxiosErrorMessage(err, 'fallback')).toBe('Email sudah terdaftar');
  });

  it('falls back when axios response has no message field', () => {
    const err = makeAxiosError({ code: 'VALIDATION_ERROR' });
    expect(extractAxiosErrorMessage(err, 'Gagal menyimpan')).toBe('Gagal menyimpan');
  });

  it('falls back when axios message is empty string', () => {
    const err = makeAxiosError({ message: '' });
    expect(extractAxiosErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('falls back when axios message is whitespace only', () => {
    const err = makeAxiosError({ message: '   ' });
    expect(extractAxiosErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('falls back when axios message is not a string', () => {
    const err = makeAxiosError({ message: 404 });
    expect(extractAxiosErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('uses Error.message when error is a plain Error, not axios', () => {
    const err = new Error('Network down');
    expect(extractAxiosErrorMessage(err, 'fallback')).toBe('Network down');
  });

  it('returns fallback for unknown error types', () => {
    expect(extractAxiosErrorMessage('string error', 'fallback')).toBe('fallback');
    expect(extractAxiosErrorMessage(null, 'fallback')).toBe('fallback');
    expect(extractAxiosErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(extractAxiosErrorMessage({ random: 'object' }, 'fallback')).toBe('fallback');
  });

  it('returns fallback for axios network errors (no response object)', () => {
    const err = new AxiosError('Network Error');
    expect(extractAxiosErrorMessage(err, 'Koneksi gagal')).toBe('Koneksi gagal');
  });
});
