import http from "../http";

export const getFlashSales = () => {
  return http.get("/admin/flashsales");
};

export const getFlashSaleDetail = (id: number | string) => {
  return http.get(`/admin/flashsales/${id}`);
};

export const createFlashSale = (payload: Record<string, unknown>) => {
  return http.post("/admin/flashsales", payload);
};

export const updateFlashSale = (
  id: number | string,
  payload: Record<string, unknown>,
  params?: Record<string, unknown>,
) => {
  return http.put(`/admin/flashsales/${id}`, payload, params ? { params } : undefined);
};

export const deleteFlashSale = (id: number | string) => {
  return http.delete(`/admin/flashsales/${id}`);
};

export const updateFlashSaleOrder = (
  updates: Array<{ id: number; order: number }>,
) => {
  return http.post("/admin/flashsales/update-order", { updates });
};

export const getFlashSaleProductDetail = (productId: number | string) => {
  return http.get(`/admin/product/${productId}`);
};
