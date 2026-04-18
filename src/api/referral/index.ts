import http from "../http";

export type ReferralListParams = {
  page?: number;
  per_page?: number;
  q?: string;
  is_active?: 0 | 1;
};

export const getReferralCodes = (params: ReferralListParams = {}) => {
  return http.get("/admin/referral-codes", { params });
};

export const createReferralCode = (payload: Record<string, unknown>) => {
  return http.post("/admin/referral-codes", payload);
};

export const updateReferralCode = (
  id: number | string,
  payload: Record<string, unknown>,
) => {
  return http.put(`/admin/referral-codes/${id}`, payload);
};

export const deleteReferralCode = (id: number | string) => {
  return http.delete(`/admin/referral-codes/${id}`);
};

export const updateReferralCodeStatus = (
  id: number | string,
  isActive: 0 | 1,
) => {
  return http.put(`/admin/referral-codes/${id}/status`, {
    is_active: isActive,
  });
};

export const bulkUpdateReferralCodeStatus = (
  ids: Array<number | string>,
  isActive: 0 | 1,
) => {
  return http.post("/admin/referral-codes/bulk/status", {
    ids,
    is_active: isActive,
  });
};

export const bulkDeleteReferralCodes = (ids: Array<number | string>) => {
  return http.post("/admin/referral-codes/bulk/delete", { ids });
};

export const bulkUploadReferralCodes = (
  formData: FormData,
  isPreview: boolean,
) => {
  return http.post(
    `/admin/referral-codes/bulk${isPreview ? "?preview=1" : ""}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 600000,
    },
  );
};
