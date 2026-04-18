import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const stripTimezoneSuffix = (value: string) =>
  value.replace(/([zZ]|[+-]\d{2}:?\d{2})$/, "");

const stripMilliseconds = (value: string) => value.replace(/\.\d+$/, "");

export const toDatePickerValue = (value?: string): Dayjs | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const cleaned = stripMilliseconds(stripTimezoneSuffix(raw)).replace("T", " ");
  const parsed = dayjs(
    cleaned,
    ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"],
    true,
  );
  if (!parsed.isValid()) return null;
  return parsed;
};

export const toServerDateTime = (value?: Dayjs | null) => {
  if (!value) return "";
  const base = dayjs(value);
  if (!base || !base.isValid()) return "";
  return base.format("YYYY-MM-DD HH:mm:ss");
};

export const digitsOnly = (value?: string) => {
  if (!value) return null;
  const cleaned = String(value).trim();
  if (!cleaned) return null;
  return cleaned.replace(/[^\d]/g, "");
};

export const parseBooleanInput = (raw: unknown, fallback = true) => {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return fallback;
  }
  if (raw === true || raw === 1) return true;
  if (raw === false || raw === 0) return false;
  const normalized = String(raw).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return fallback;
};
