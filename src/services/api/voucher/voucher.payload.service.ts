import type { Dayjs } from "dayjs";
import {
  digitsOnly,
  toServerDateTime,
} from "../../../utils/voucher/formValue";

export type VoucherPayloadFormValues = {
  id?: number | string;
  name?: string;
  code?: string;
  min_purchase_amount?: number | string | null;
  type?: number | null;
  qty?: number | string;
  is_percentage?: number;
  is_active?: number;
  started_at?: Dayjs | null;
  expired_at?: Dayjs | null;
  per_user_limit?: number | string | null;
  scope_type?: number;
  scope_ids?: number[];
  percentage?: string | number | null;
  max_disc_price?: string;
  price?: string;
};

type BuildVoucherPayloadArgs = {
  values: VoucherPayloadFormValues;
  limitPerCustomer: boolean;
  stackWithOtherPromo: boolean;
  stackWithOtherVoucher: boolean;
  scopeType: number;
  scopeAll: number;
  normalizeScopeIds: (raw: any) => number[];
};

export const buildVoucherSubmitPayload = ({
  values,
  limitPerCustomer,
  stackWithOtherPromo,
  stackWithOtherVoucher,
  scopeType,
  scopeAll,
  normalizeScopeIds,
}: BuildVoucherPayloadArgs) => {
  const payload: Record<string, any> = {
    id: values.id ? Number(values.id) : undefined,
    name: String(values.name ?? "").trim(),
    code: String(values.code ?? "").trim(),
    min_purchase_amount:
      values.min_purchase_amount === undefined || values.min_purchase_amount === null
        ? null
        : Number(values.min_purchase_amount),
    type: values.type != null ? Number(values.type) : null,
    qty: Number(values.qty ?? 0),
    is_percentage: Number(values.is_percentage ?? 1),
    is_active: Number(values.is_active ?? 1),
    started_at: toServerDateTime(values.started_at),
    expired_at: toServerDateTime(values.expired_at),
    per_user_limit: limitPerCustomer ? Number(values.per_user_limit ?? 1) : null,
    is_stackable: Boolean(stackWithOtherPromo),
    is_voucher_stackable: Boolean(stackWithOtherVoucher),
    scope_type: Number(values.scope_type ?? scopeType ?? scopeAll),
    scope_ids: normalizeScopeIds(values.scope_ids),
  };

  if (payload.scope_type === scopeAll) {
    payload.scope_ids = [];
  }

  if (payload.is_percentage === 1) {
    payload.percentage =
      values.percentage === undefined || String(values.percentage).trim() === ""
        ? null
        : Number(values.percentage);

    payload.max_disc_price = digitsOnly(values.max_disc_price);
    payload.price = null;
  } else {
    payload.price = digitsOnly(values.price);
    payload.max_disc_price = null;
    payload.percentage = null;
  }

  return payload;
};
