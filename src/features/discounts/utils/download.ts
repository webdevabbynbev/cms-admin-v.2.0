export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildDiscountItemFilename(
  discountCode: string,
  scope: string,
  format: 'csv' | 'excel',
  kind: 'template' | 'export',
): string {
  const ext = format === 'excel' ? 'xlsx' : 'csv';
  const safeCode = discountCode.replace(/[^a-zA-Z0-9_-]/g, '_') || 'discount';
  return `${kind}-${safeCode}-${scope}.${ext}`;
}
