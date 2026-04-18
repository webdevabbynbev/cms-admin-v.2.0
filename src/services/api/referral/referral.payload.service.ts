import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { ReferralCodeRecord } from "./referral.types";
import { toBool } from "../../../utils/referral/format";

export type ReferralCodeFormValues = {
  code: string;
  discount_percent: number;
  is_active: boolean;
  started_at?: Dayjs | null;
  expired_at?: Dayjs | null;
  max_uses_total?: number | null;
  limit_per_user?: boolean;
  max_uses_per_user?: number | null;
};

export const defaultReferralFormValues: ReferralCodeFormValues = {
  code: "",
  discount_percent: 10,
  is_active: true,
  started_at: null,
  expired_at: null,
  max_uses_total: null,
  limit_per_user: true,
  max_uses_per_user: 1,
};

export const mapReferralRecordToFormValues = (
  data?: ReferralCodeRecord | null,
): ReferralCodeFormValues => {
  if (!data) return { ...defaultReferralFormValues };

  return {
    code: String(data.code ?? ""),
    discount_percent: Number(data.discountPercent ?? data.discount_percent ?? 0),
    is_active: toBool(data.isActive ?? data.is_active ?? 1),
    started_at: data.startedAt
      ? dayjs(data.startedAt)
      : data.started_at
        ? dayjs(data.started_at)
        : null,
    expired_at: data.expiredAt
      ? dayjs(data.expiredAt)
      : data.expired_at
        ? dayjs(data.expired_at)
        : null,
    max_uses_total: Number(data.maxUsesTotal ?? data.max_uses_total ?? 0)
      ? Number(data.maxUsesTotal ?? data.max_uses_total)
      : null,
    limit_per_user: true,
    max_uses_per_user: 1,
  };
};

export const buildReferralCodePayload = (values: ReferralCodeFormValues) => {
  const maxUsesTotal =
    values.max_uses_total === undefined || values.max_uses_total === null
      ? null
      : Number(values.max_uses_total);

  return {
    code: String(values.code ?? "")
      .trim()
      .toUpperCase(),
    discount_percent: Number(values.discount_percent ?? 0),
    is_active: values.is_active ? 1 : 0,
    started_at: values.started_at ? dayjs(values.started_at).toISOString() : null,
    expired_at: values.expired_at ? dayjs(values.expired_at).toISOString() : null,
    max_uses_total: maxUsesTotal,
    // Hardcode: setiap user hanya bisa claim 1x per referral code
    max_uses_per_user: 1,
  };
};
