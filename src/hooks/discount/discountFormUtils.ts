import helper from "../../utils/helper";

export const loadXlsx = async (): Promise<typeof import("xlsx")> => {
  const mod = await import("xlsx");
  return ((mod as unknown as { default?: typeof import("xlsx") }).default ??
    mod) as typeof import("xlsx");
};

export const toDateOnly = (v: any): string | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (s.includes("T") && s.length >= 10) return s.slice(0, 10);
  if (s.length >= 10) return s.slice(0, 10);
  return s;
};

export const resolveIdentifier = (raw?: string) => {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  const idNum = Number(trimmed);
  if (Number.isFinite(idNum) && idNum > 0) return String(idNum);
  return trimmed;
};

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export const rupiahFormatter = (value: string | number | undefined) => {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? helper.formatRupiah(digits) : "";
};

export const rupiahParser = (value?: string) => {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  const n = Number(digits || 0);
  return Number.isFinite(n) ? n : 0;
};

export const prettyVariantName = (label: string) => {
  const s = String(label ?? "").trim();
  if (!s) return "Varian";
  const parts = s
    .split(" - ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return s;
  return parts[parts.length - 1] || s;
};

export const normalizeHeader = (value: string) =>
  String(value ?? "")
    .replace(/\ufeff/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const getRowValue = (
  row: Record<string, unknown>,
  aliases: string[],
) => {
  const aliasNorms = aliases.map(normalizeHeader).filter(Boolean);

  for (const [key, val] of Object.entries(row)) {
    const nk = normalizeHeader(key);
    if (!nk) continue;

    const hit = aliasNorms.some(
      (a) => nk === a || nk.startsWith(a) || nk.includes(a),
    );
    if (hit) return val;
  }
  return undefined;
};

export const toNumberSafe = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[^\d-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

export const guessCsvDelimiter = (text: string) => {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  const tabs = (firstLine.match(/\t/g) ?? []).length;

  if (tabs > commas && tabs > semis) return "\t";
  if (semis > commas) return ";";
  return ",";
};
