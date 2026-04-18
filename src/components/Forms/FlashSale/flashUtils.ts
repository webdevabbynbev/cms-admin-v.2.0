import helper from "../../../utils/helper";

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const rupiahFormatter = (value: string | number | undefined) => {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? helper.formatRupiah(digits) : "";
};

export const rupiahParser = (value?: string) => {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return toNumber(digits, 0);
};

export const percentParser = (value?: string) => {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return toNumber(digits, 0);
};

export const prettyVariantName = (label: string) => {
  const s = String(label ?? "").trim();
  if (!s) return "Varian";
  const idx = s.indexOf(" - ");
  if (idx >= 0 && idx + 3 < s.length) return s.slice(idx + 3);
  return s;
};

export const computeFromPercent = (basePrice: number, percent: number) => {
  const pct = clamp(Math.round(percent), 0, 100);
  const discounted = Math.round((basePrice * (100 - pct)) / 100);
  return { pct, discounted: clamp(discounted, 0, basePrice) };
};

export const computeFromPrice = (basePrice: number, price: number) => {
  const p = clamp(Math.round(price), 0, basePrice);
  const pct =
    basePrice > 0 ? Math.round(((basePrice - p) / basePrice) * 100) : 0;
  return { p, pct: clamp(pct, 0, 100) };
};
