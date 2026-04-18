import { clamp, toDateOnly } from "./discountFormUtils";

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const computeFromPercent = (basePrice: number, percent: number) => {
  // Allow decimals, max 2 digits precision if needed, but simple clamp is enough
  const pct = clamp(Number(percent), 0, 100);
  const discounted = Math.round((basePrice * (100 - pct)) / 100);
  return { pct, discounted: clamp(discounted, 0, basePrice) };
};

export const computeFromPrice = (basePrice: number, price: number) => {
  const p = clamp(Math.round(price), 0, basePrice);
  const rawPct =
    basePrice > 0 ? ((basePrice - p) / basePrice) * 100 : 0;

  // Format to max 2 decimals to avoid long floating point issues (e.g. 17.5000001)
  // parseFloat to remove unnecessary trailing zeros
  const pct = parseFloat(rawPct.toFixed(2));

  return { p, pct: clamp(pct, 0, 100) };
};

export const mapApiToForm = (data: any) => {
  const started = toDateOnly(data?.startedAt ?? data?.started_at);
  const expired = toDateOnly(data?.expiredAt ?? data?.expired_at);
  return {
    name: data?.name ?? "",
    started_at: started,
    expired_at: expired || started || null,

    is_active: 1,
    is_ecommerce: 1,
    is_pos: 0,
    no_expiry: 0,
    days_of_week: ["0", "1", "2", "3", "4", "5", "6"],
  };
};
