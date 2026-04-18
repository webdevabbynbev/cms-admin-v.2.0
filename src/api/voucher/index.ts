import http from "../http";

export type VoucherStatus = 1 | 2;

export type VoucherListParams = {
  name?: string;
  page?: number;
  per_page?: number;
  type?: number;
  reward_type?: number;
};

export const getVoucherList = (params: VoucherListParams = {}) => {
  return http.get("/admin/voucher", { params });
};

export const createVoucher = (payload: Record<string, unknown>) => {
  return http.post("/admin/voucher", payload);
};

export const updateVoucher = (payload: Record<string, unknown>) => {
  return http.put("/admin/voucher", payload);
};

export const deleteVoucher = (id: number | string) => {
  return http({
    url: "/admin/voucher",
    method: "DELETE",
    data: { id },
  });
};

export const updateVoucherStatus = (
  id: number | string,
  status: VoucherStatus,
) => {
  return http.put("/admin/voucher/status", { id, status });
};

export const updateVoucherVisibility = (
  id: number | string,
  isVisible: boolean,
) => {
  return http.put("/admin/voucher/visibility", { id, is_visible: isVisible });
};

export * from "./scope";
