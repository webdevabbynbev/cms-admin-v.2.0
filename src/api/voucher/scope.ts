import http from "../http";

type ScopePagingParams = {
  q?: string;
  page?: number;
  per_page?: number;
};

type ProductScopeParams = ScopePagingParams & {
  ids?: string;
  brand_id?: string | number;
  load_all?: 1;
  with_variants?: 1;
};

type VariantScopeParams = ScopePagingParams & {
  ids?: string;
};

export const getVoucherScopeBrands = (params: ScopePagingParams = {}) => {
  return http.get("/admin/discount-options/brands", { params });
};

export const getVoucherScopeProducts = (params: ProductScopeParams = {}) => {
  return http.get("/admin/discount-options/products", { params });
};

export const getVoucherScopeVariants = (params: VariantScopeParams = {}) => {
  return http.get("/admin/discount-options/product-variants", { params });
};
