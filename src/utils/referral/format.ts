import dayjs from "dayjs";
import type { ReferralCodeRecord } from "../../services/api/referral/referral.types";

export const toBool = (value: unknown) => {
  if (typeof value === "boolean") return value;
  return Number(value ?? 0) === 1;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return d.format("DD/MM/YYYY HH:mm");
};

export const getPercent = (r: ReferralCodeRecord) =>
  Number(r.discountPercent ?? r.discount_percent ?? 0);

export const getActive = (r: ReferralCodeRecord) =>
  toBool(r.isActive ?? r.is_active ?? 0);

export const getUsage = (r: ReferralCodeRecord) =>
  Number(r.usageCount ?? r.usage_count ?? 0);

export const getMaxUsesTotal = (r: ReferralCodeRecord) =>
  Number(r.maxUsesTotal ?? r.max_uses_total ?? 0);

export const getRemainingQty = (r: ReferralCodeRecord) => {
  const remainingRaw = r.remainingUsesTotal ?? r.remaining_uses_total;
  if (remainingRaw !== null && remainingRaw !== undefined && remainingRaw !== "") {
    const remaining = Number(remainingRaw);
    return Number.isFinite(remaining) ? Math.max(0, remaining) : null;
  }

  const maxUses = getMaxUsesTotal(r);
  if (!Number.isFinite(maxUses) || maxUses <= 0) return null;
  return Math.max(0, maxUses - getUsage(r));
};
