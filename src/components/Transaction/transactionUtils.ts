import { formatWibDateTime } from "../../utils/timezone";

export type TxUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  name?: string;
};

export type TxDetail = {
  qty: number;
  product?: { name?: string };
  attributes?: any;
  isGiftItem?: boolean;
  is_gift_item?: boolean;
  is_b1g1_gift?: boolean;
  variant?: {
    sku?: string;
    barcode?: string;
    name?: string;
    label?: string;
    variantLabel?: string;
    attributes?: Array<{
      value?: string;
      attribute_value?: string;
      attribute?: { name?: string };
    }>;
  };
};

export type TxShipment = {
  resiNumber?: string;
  resi_number?: string;
  service?: string;
  serviceType?: string;
  price?: number | string;
  pic?: string;
  picPhone?: string;
  pic_phone?: string;
};

export type Tx = {
  id: number;
  transactionNumber: string;
  transactionStatus: string;
  transactionStatusLabel?: string;
  failureSource?: string | null;
  amount: number | string;
  createdAt?: string;
  created_at?: string;
  user?: TxUser;
  shipments?: TxShipment[];
  details?: TxDetail[];
};

export const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  "1": { text: "Belum Dibayar", color: "orange" },
  "5": { text: "Sudah Dibayar", color: "blue" },
  "2": { text: "Sedang Dikemas", color: "purple" },
  "3": { text: "Dalam Pengiriman", color: "gold" },
  "6": { text: "Diterima", color: "cyan" },
  "4": { text: "Selesai", color: "green" },
  "9": { text: "Gagal/Dibatalkan", color: "red" },
};

const FAILURE_SOURCE_LABEL: Record<string, string> = {
  user_cancelled: "Dibatalkan User",
  expired: "Expired",
  admin_cancelled: "Dibatalkan Admin",
};

export const STATUS_FILTER_OPTIONS = [
  { value: "1", label: STATUS_LABEL["1"].text, color: STATUS_LABEL["1"].color },
  { value: "5", label: STATUS_LABEL["5"].text, color: STATUS_LABEL["5"].color },
  { value: "2", label: STATUS_LABEL["2"].text, color: STATUS_LABEL["2"].color },
  { value: "3", label: STATUS_LABEL["3"].text, color: STATUS_LABEL["3"].color },
  { value: "6", label: STATUS_LABEL["6"].text, color: STATUS_LABEL["6"].color },
  { value: "4", label: STATUS_LABEL["4"].text, color: STATUS_LABEL["4"].color },
  { value: "9:user_cancelled", label: FAILURE_SOURCE_LABEL.user_cancelled, color: "red" },
  { value: "9:expired", label: FAILURE_SOURCE_LABEL.expired, color: "red" },
  { value: "9:admin_cancelled", label: FAILURE_SOURCE_LABEL.admin_cancelled, color: "red" },
  { value: "9", label: STATUS_LABEL["9"].text, color: STATUS_LABEL["9"].color },
] as const;

export function getTransactionStatusMeta(
  txOrStatus:
    | Pick<Tx, "transactionStatus" | "transactionStatusLabel" | "failureSource">
    | string
    | number
    | null
    | undefined,
) {
  if (
    txOrStatus &&
    typeof txOrStatus === "object" &&
    "transactionStatus" in txOrStatus
  ) {
    const key = String(txOrStatus.transactionStatus ?? "");
    const fallback = STATUS_LABEL[key] || {
      text: `Unknown (${key})`,
      color: "default",
    };
    const failureLabel =
      key === "9" && txOrStatus.failureSource
        ? FAILURE_SOURCE_LABEL[String(txOrStatus.failureSource)] || fallback.text
        : fallback.text;

    return {
      ...fallback,
      text: txOrStatus.transactionStatusLabel || failureLabel,
    };
  }

  const key = String(txOrStatus ?? "");
  return (
    STATUS_LABEL[key] || {
      text: `Unknown (${key})`,
      color: "default",
    }
  );
}

export function getTransactionStepCurrent(status: string | number | null | undefined) {
  const value = String(status ?? "");
  if (value === "1") return 0;
  if (value === "5") return 1;
  if (value === "2") return 2;
  if (value === "3") return 3;
  if (value === "6") return 4;
  if (value === "4") return 5;
  return 0;
}

export function money(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "");
  return new Intl.NumberFormat("id-ID").format(n);
}

export function formatDate(v?: string) {
  return formatWibDateTime(v);
}
