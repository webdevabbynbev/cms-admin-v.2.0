import http from "../http";

export type DiscountListParams = {
  q?: string;
  page?: number;
  per_page?: number;
};

export const getDiscountList = (params: DiscountListParams = {}) => {
  return http.get("/admin/discounts", { params });
};

export const getDiscountDetail = (identifier: string | number) => {
  return http.get(`/admin/discounts/${encodeURIComponent(String(identifier))}`);
};

export const createDiscount = (payload: Record<string, unknown>) => {
  return http.post("/admin/discounts", payload);
};

export const updateDiscount = (
  identifier: string | number,
  payload: Record<string, unknown>,
) => {
  return http.put(
    `/admin/discounts/${encodeURIComponent(String(identifier))}`,
    payload,
  );
};

export const updateDiscountStatus = (
  identifier: string | number,
  isActive: 0 | 1,
  extra?: {
    id?: string | number | null;
    code?: string | null;
    isEcommerce?: 0 | 1;
    isPos?: 0 | 1;
  },
) => {
  const fallbackId =
    extra?.id !== null && extra?.id !== undefined ? extra.id : identifier;
  const code = String(extra?.code ?? "").trim();
  return http.put("/admin/discounts/status", {
    id: fallbackId,
    ...(code ? { code } : {}),
    is_active: isActive,
    isActive,
    ...(typeof extra?.isEcommerce === "number"
      ? { is_ecommerce: extra.isEcommerce }
      : {}),
    ...(typeof extra?.isPos === "number" ? { is_pos: extra.isPos } : {}),
  });
};

export const deleteDiscount = (identifier: string | number) => {
  return http.delete(`/admin/discounts/${encodeURIComponent(String(identifier))}`);
};

export const exportDiscountItems = (
  identifier: string | number,
  format: "csv" | "excel",
  scope: "variant" | "product" | "brand",
) => {
  return http.get(
    `/admin/discounts/${encodeURIComponent(String(identifier))}/items/export`,
    {
      params: { format, scope },
      responseType: "blob",
    },
  );
};

export const downloadDiscountTemplate = (
  identifier: string | number,
  format: "csv" | "excel",
  scope: "variant" | "product" | "brand",
) => {
  return http.get(
    `/admin/discounts/${encodeURIComponent(String(identifier))}/items/template`,
    {
      params: { format, scope },
      responseType: "blob",
    },
  );
};

export const importDiscountItems = (
  identifier: string | number,
  formData: FormData,
) => {
  return http.post(
    `/admin/discounts/${encodeURIComponent(String(identifier))}/items/import`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};

export type DiscountOptionParams = {
  q?: string;
  page?: number;
  per_page?: number;
  brand_id?: number | string;
  ids?: number[] | string;
  product_id?: number | string;
  variant_ids?: number[] | string;
  with_variants?: number | 0 | 1;
  load_all?: number | 0 | 1;
};

export const getDiscountOptionBrands = (params: DiscountOptionParams = {}) => {
  return http.get("/admin/discount-options/brands", { params });
};

export const getDiscountOptionProducts = (params: DiscountOptionParams = {}) => {
  return http.get("/admin/discount-options/products", { params });
};

export const getDiscountOptionProductVariants = (
  params: DiscountOptionParams = {},
) => {
  return http.get("/admin/discount-options/product-variants", { params });
};

export const getDiscountProductList = (params: {
  name?: string;
  page?: number;
  per_page?: number;
}) => {
  return http.get("/admin/product", { params });
};

export const getDiscountProductDetailByUrl = (url: string) => {
  return http.get(url);
};
