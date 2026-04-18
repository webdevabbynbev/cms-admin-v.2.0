type Row = Record<string, any>;

const asString = (value: unknown): string => String(value ?? "").toLowerCase().trim();
const asNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const stringSorter =
  <T extends Row>(key: keyof T) =>
  (a: T, b: T): number =>
    asString(a[key]).localeCompare(asString(b[key]), "id");

export const numberSorter =
  <T extends Row>(key: keyof T) =>
  (a: T, b: T): number =>
    asNumber(a[key]) - asNumber(b[key]);

export const dateSorter =
  <T extends Row>(key: keyof T) =>
  (a: T, b: T): number =>
    new Date(String(a[key] ?? 0)).getTime() - new Date(String(b[key] ?? 0)).getTime();
