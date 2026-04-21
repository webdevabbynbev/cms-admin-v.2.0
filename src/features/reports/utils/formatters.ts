export function formatIDR(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  const rounded = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  return `Rp ${new Intl.NumberFormat('id-ID').format(rounded)}`;
}

export function formatNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  const rounded = Number.isFinite(n) ? Math.round(n) : 0;
  return new Intl.NumberFormat('id-ID').format(rounded);
}
