import type React from "react";
import { message } from "antd";
import {
  getDiscountOptionBrands,
  getDiscountOptionProducts,
  getDiscountOptionProductVariants,
  getDiscountProductList,
  getDiscountProductDetailByUrl,
} from "../../api/discount";
import type { VariantRow } from "./discountFormTypes";
import { prettyVariantName } from "./discountFormUtils";

export type ProductOption = {
  value: number;
  label: string;
  brandId?: number | null;
  brandName?: string | null;
  isSale?: boolean;
  isFlashSale?: boolean;
};

export type ProductMeta = {
  productId: number;
  productName: string;
  brandId: number | null;
  brandName: string;
  isSale: boolean;
  isFlashSale: boolean;
  image?: string | null;
};

type SearchableProductOption = ProductOption & {
  searchText: string;
  image?: string | null;
};

type VariantOption = { label: string; value: number; productId?: number };

type VariantApiRow = {
  product_variant_id: number;
  product_id: number;
  sku: string | null;
  price: number;
  stock: number;
  label: string;
  image?: string | null;
  isSale?: boolean | number | string;
  is_sale?: boolean | number | string;
  isFlashSale?: boolean | number | string;
  is_flash_sale?: boolean | number | string;
  sale?: boolean | number | string;
  on_sale?: boolean | number | string;
  sale_status?: boolean | number | string;
  flash_sale?: boolean | number | string;
  on_flash_sale?: boolean | number | string;
  flashsale?: boolean | number | string;
};

const toBoolFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(s)) return true;
    if (["0", "false", "no", "n", "", "null", "undefined"].includes(s)) {
      return false;
    }
  }
  return Boolean(value);
};

const isSkuLike = (value: string) => {
  const v = String(value ?? "")
    .trim()
    .replace(/^SKU\s*:?\s*/i, "");
  if (!v) return false;
  if (/^[A-Z0-9]+(?:-[A-Z0-9]+){1,}$/i.test(v)) return true;
  if (/^\d{8,}$/.test(v)) return true;
  return false;
};

const cleanPart = (value: unknown) => String(value ?? "").trim();

const buildBaseProductLabel = (brandName: string, productName: string) => {
  const brand = cleanPart(brandName);
  const product = cleanPart(productName);
  if (!brand) return product || "Produk";
  if (product.toLowerCase().startsWith(`${brand.toLowerCase()} -`)) return product;
  return `${brand} - ${product || "Produk"}`;
};

const sanitizeFullVariantLabel = (value: string, fallbackVariantId = 0) => {
  const raw = String(value ?? "")
    .replace(/\s*SKU\s*:.*$/i, "")
    .trim();
  if (!raw) return fallbackVariantId > 0 ? `VAR-${fallbackVariantId}` : "Varian";

  const parts = raw
    .split(" - ")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^Varian\s*:\s*/i, "").trim())
    .filter((p) => p && !isSkuLike(p));

  if (!parts.length) return fallbackVariantId > 0 ? `VAR-${fallbackVariantId}` : "Varian";
  return parts.join(" - ");
};

const resolveVariantPart = (variant: any, fallbackVariantId: number) => {
  const directCandidates = [
    variant?.variant_label,
    variant?.variantName,
    variant?.variant_name,
    variant?.name,
    variant?.sku_variant_1,
  ];
  for (const candidate of directCandidates) {
    const value = cleanPart(candidate);
    if (!value || isSkuLike(value)) continue;
    return value;
  }

  const rawLabel = cleanPart(variant?.label);
  if (rawLabel) {
    const parts = rawLabel
      .replace(/\s*SKU\s*:.*$/i, "")
      .split(" - ")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.replace(/^Varian\s*:\s*/i, "").trim())
      .filter((p) => p && !isSkuLike(p));
    if (parts.length) return parts[parts.length - 1];
  }

  return fallbackVariantId > 0 ? `VAR-${fallbackVariantId}` : "Varian";
};

const composeVariantLabel = (
  variant: any,
  variantId: number,
  fallback?: { brandName?: string | null; productName?: string | null },
) => {
  const brandName = cleanPart(
    fallback?.brandName ??
      variant?.brand_name ??
      variant?.brandName ??
      variant?.brand?.name ??
      "",
  );
  const productName = cleanPart(
    fallback?.productName ??
      variant?.product_name ??
      variant?.productName ??
      variant?.product?.name ??
      "",
  );
  const variantPart = resolveVariantPart(variant, variantId);

  if (brandName || productName) {
    const base = buildBaseProductLabel(brandName, productName);
    return sanitizeFullVariantLabel(`${base} - ${variantPart}`, variantId);
  }

  return sanitizeFullVariantLabel(
    cleanPart(variant?.label) || variantPart || `VAR-${variantId}`,
    variantId,
  );
};

const normalizeSearchText = (value: string) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const compactSearchText = (value: string) =>
  normalizeSearchText(value).replace(/\s+/g, "");

const splitSearchTokens = (value: string) =>
  normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const isLooseMatch = (label: string, query: string) => {
  const qNorm = normalizeSearchText(query);
  if (!qNorm) return true;

  const labelNorm = normalizeSearchText(label);
  const labelCompact = compactSearchText(label);
  const qCompact = qNorm.replace(/\s+/g, "");
  const tokens = splitSearchTokens(qNorm);
  const strongTokens = tokens.filter((token) => token.length >= 2);

  const strictTokenMatch = strongTokens.every((t) => {
    const tokenCompact = t.replace(/\s+/g, "");
    return labelNorm.includes(t) || labelCompact.includes(tokenCompact);
  });

  if (strictTokenMatch) return true;
  if (labelNorm.includes(qNorm)) return true;
  if (qCompact && labelCompact.includes(qCompact)) return true;

  const matchedStrongTokenCount = strongTokens.filter((token) => {
    const tokenCompact = token.replace(/\s+/g, "");
    return labelNorm.includes(token) || labelCompact.includes(tokenCompact);
  }).length;

  if (strongTokens.length <= 1) return matchedStrongTokenCount >= 1;
  if (strongTokens.length === 2) return matchedStrongTokenCount >= 2;
  return matchedStrongTokenCount >= 2;
};

type ProductHandlersDeps = {
  productMetaById: Record<number, ProductMeta>;
  productNameById: Record<number, string>;
  productSearchSeqRef: React.MutableRefObject<number>;
  variantSearchSeqRef: React.MutableRefObject<number>;
  productOptionsCacheRef: React.MutableRefObject<
    Map<string, SearchableProductOption[]>
  >;
  variantOptionsCacheRef: React.MutableRefObject<Map<string, VariantOption[]>>;
  getVariants: () => VariantRow[];
  setProductLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setProductOptions: React.Dispatch<React.SetStateAction<ProductOption[]>>;
  setBrandProductOptions: React.Dispatch<React.SetStateAction<ProductOption[]>>;
  setProductMetaById: React.Dispatch<
    React.SetStateAction<Record<number, ProductMeta>>
  >;
  setProductNameById: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  setVariants: React.Dispatch<React.SetStateAction<VariantRow[]>>;
  setSelectedVariantIds: React.Dispatch<React.SetStateAction<number[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setBrandLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setBrandOptions: React.Dispatch<
    React.SetStateAction<{ label: string; value: number }[]>
  >;
  setVariantLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setVariantOptions: React.Dispatch<React.SetStateAction<VariantOption[]>>;
};

type AddProductsOptions = {
  blockProductsOnSale?: boolean;
  defaults?: {
    discountPercent?: number | null;
    maxDiscount?: number | null;
    promoStock?: number | null;
  };
};

export const createDiscountProductHandlers = (deps: ProductHandlersDeps) => {
  const {
    productMetaById,
    productNameById,
    productSearchSeqRef,
    variantSearchSeqRef,
    productOptionsCacheRef,
    variantOptionsCacheRef,
    getVariants,
    setProductLoading,
    setProductOptions,
    setBrandProductOptions,
    setProductMetaById,
    setProductNameById,
    setVariants,
    setSelectedVariantIds,
    setLoading,
    setBrandLoading,
    setBrandOptions,
    setVariantLoading,
    setVariantOptions,
  } = deps;

  const putCache = <T,>(
    ref: React.MutableRefObject<Map<string, T>>,
    key: string,
    value: T,
  ) => {
    const cache = ref.current;
    cache.set(key, value);
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }
  };

  const searchProducts = async (keyword: string, brandId?: number | null) => {
    const q = String(keyword ?? "").trim();
    const normalizedBrandId = Number(brandId ?? 0);
    const cacheKey = `product:${normalizedBrandId}:${normalizeSearchText(q)}`;
    const current = ++productSearchSeqRef.current;
    const qTokens = splitSearchTokens(q);
    const firstToken = qTokens[0] ?? "";
    const normalizedQuery = normalizeSearchText(q);
    const cached = productOptionsCacheRef.current.get(cacheKey);
    if (cached) {
      const cloned = cached.map((opt) => ({ ...opt }));
      const uiOptions: ProductOption[] = cloned.map((opt) => ({
        value: Number(opt.value ?? 0),
        label: String(opt.label ?? "Produk"),
        brandId: opt.brandId ?? null,
        brandName: opt.brandName ?? null,
        isSale: Boolean(opt.isSale),
        isFlashSale: Boolean(opt.isFlashSale),
      }));
      if (brandId) setBrandProductOptions(uiOptions);
      else setProductOptions(uiOptions);
      setProductLoading(false);
      return;
    }
    if (q) {
      if (brandId) setBrandProductOptions([]);
      else setProductOptions([]);
    }
    setProductLoading(true);

    const mapProductOption = (p: any): SearchableProductOption => {
      const id = Number(p?.id ?? 0);
      const label = String(p?.name ?? "Produk");
      const brandName = String(
        p?.brandName ?? p?.brand_name ?? p?.brand?.name ?? "",
      ).trim();
      const searchText = [
        buildBaseProductLabel(brandName, label),
        `${brandName} ${label}`.trim(),
        `${label} ${brandName}`.trim(),
      ]
        .filter(Boolean)
        .join(" | ");

      return {
        value: id,
        label,
        brandId: p.brandId ?? p.brand_id ?? null,
        brandName: p.brandName ?? p.brand_name ?? null,
        isSale: toBoolFlag(p.isSale ?? p.is_sale ?? 0),
        isFlashSale: toBoolFlag(p.isFlashSale ?? p.is_flash_sale ?? 0),
        image: p.image ?? p.path ?? null,
        searchText,
      };
    };

    const normalizeProductOptions = (
      options: SearchableProductOption[],
    ): SearchableProductOption[] => {
      const filteredByBrand = brandId
        ? options.filter(
            (o) => Number(o?.brandId ?? 0) === Number(brandId ?? 0),
          )
        : options;

      const qNorm = normalizeSearchText(q);
      const qCompact = compactSearchText(q);
      const brandMatchedPool =
        !brandId && qNorm
          ? filteredByBrand.filter((opt) => {
              const brandNorm = normalizeSearchText(String(opt.brandName ?? ""));
              const brandCompact = compactSearchText(String(opt.brandName ?? ""));
              if (!brandNorm) return false;
              return (
                brandNorm.includes(qNorm) ||
                (qCompact ? brandCompact.includes(qCompact) : false)
              );
            })
          : [];

      const basePool =
        brandMatchedPool.length > 0 ? brandMatchedPool : filteredByBrand;

      const strictFiltered = q
        ? basePool.filter((opt) =>
            isLooseMatch(String(opt.searchText ?? opt.label ?? ""), q),
          )
        : basePool;

      const fallbackTokens = qTokens.filter((token) => token.length >= 2);
      const broadFiltered =
        q && strictFiltered.length === 0 && fallbackTokens.length > 0
          ? basePool.filter((opt) => {
              const searchable = normalizeSearchText(
                String(opt.searchText ?? opt.label ?? ""),
              );
              return fallbackTokens.some((token) => searchable.includes(token));
            })
          : strictFiltered;

      const uniqueById = new Map<number, SearchableProductOption>();
      broadFiltered.forEach((opt) => {
        const id = Number(opt.value ?? 0);
        if (!id || uniqueById.has(id)) return;
        uniqueById.set(id, {
          value: id,
          label: String(opt.label ?? "Produk"),
          brandId: opt.brandId ?? null,
          brandName: opt.brandName ?? null,
          isSale: Boolean(opt.isSale),
          isFlashSale: Boolean(opt.isFlashSale),
          image: opt.image ?? null,
          searchText: String(opt.searchText ?? ""),
        });
      });

      return Array.from(uniqueById.values());
    };

    const persistProductMeta = (options: SearchableProductOption[]) => {
      const uiOptions: ProductOption[] = options.map((opt) => ({
        value: Number(opt.value ?? 0),
        label: String(opt.label ?? "Produk"),
        brandId: opt.brandId ?? null,
        brandName: opt.brandName ?? null,
        isSale: Boolean(opt.isSale),
        isFlashSale: Boolean(opt.isFlashSale),
      }));

      if (brandId) setBrandProductOptions(uiOptions);
      else setProductOptions(uiOptions);
      setProductMetaById((prev) => {
        const next = { ...prev };
        for (const o of options) {
          if (!o.value) continue;
          next[o.value] = {
            productId: o.value,
            productName: String(o.label ?? "Produk"),
            brandId: o.brandId ?? null,
            brandName: String(o.brandName ?? ""),
            isSale: Boolean(o.isSale),
            isFlashSale: Boolean(o.isFlashSale),
            image: o.image ?? null,
          };
        }
        return next;
      });
    };

    const queryProductsByBrandKeyword = async (keywordValue: string) => {
      const brandKeyword = String(keywordValue ?? "").trim();
      if (!brandKeyword || brandId) return [] as any[];

      try {
        const brandsResp: any = await getDiscountOptionBrands({
          q: brandKeyword,
          page: 1,
          per_page: 8,
        });
        const brands = brandsResp?.data?.serve?.data ?? [];
        const brandIds = Array.from(
          new Set(
            (Array.isArray(brands) ? brands : [])
              .map((b: any) => Number(b?.id ?? 0))
              .filter((id: number) => Number.isFinite(id) && id > 0),
          ),
        ).slice(0, 5);

        if (!brandIds.length) return [] as any[];

        const fetchProductsByBrand = async (bid: number) => {
          const resp: any = await getDiscountOptionProducts({
            q: "",
            brand_id: bid,
            load_all: 1,
          });
          const rows = resp?.data?.serve?.data ?? [];
          return Array.isArray(rows) ? rows : [];
        };

        const productLists = await Promise.all(
          brandIds.map(async (bid) => {
            try {
              return await fetchProductsByBrand(bid);
            } catch {
              return [];
            }
          }),
        );

        return productLists.flat();
      } catch {
        return [] as any[];
      }
    };

    try {
      const queryPrimary = async (query: string) => {
        const resp: any = await getDiscountOptionProducts({
          q: query,
          page: 1,
          per_page: 50,
          ...(brandId ? { brand_id: brandId } : {}),
        });
        return (resp?.data?.serve?.data ?? []) as any[];
      };

      let list = await queryPrimary(q);
      if (current !== productSearchSeqRef.current) return;
      if (
        q &&
        qTokens.length > 1 &&
        list.length < 8 &&
        firstToken &&
        firstToken !== normalizedQuery
      ) {
        const extraList = await queryPrimary(firstToken);
        if (current !== productSearchSeqRef.current) return;
        if (extraList.length) list = [...list, ...extraList];

        if (!list.length) {
          const secondToken = qTokens.find(
            (token, idx) => idx > 0 && token.length >= 3,
          );
          if (secondToken && secondToken !== firstToken) {
            const secondList = await queryPrimary(secondToken);
            if (current !== productSearchSeqRef.current) return;
            if (secondList.length) list = [...list, ...secondList];
          }
        }
      }

      let options = normalizeProductOptions(list.map(mapProductOption));
      const shouldMergeBrandOptions = !brandId && q.length >= 3;
      if (shouldMergeBrandOptions) {
        const fromBrandKeyword = await queryProductsByBrandKeyword(q);
        if (current !== productSearchSeqRef.current) return;
        if (fromBrandKeyword.length) {
          options = normalizeProductOptions(
            [...list, ...fromBrandKeyword].map(mapProductOption),
          );
        }
      }
      putCache(
        productOptionsCacheRef,
        cacheKey,
        options.map((opt) => ({ ...opt })),
      );
      persistProductMeta(options);
    } catch (e1: any) {
      try {
        const queryFallback = async (query: string) => {
          const resp2: any = await getDiscountProductList({
            name: query,
            page: 1,
            per_page: 50,
          });
          return (resp2?.data?.serve?.data ?? []) as any[];
        };

        let products = await queryFallback(q);
        if (current !== productSearchSeqRef.current) return;
        if (
          q &&
          qTokens.length > 1 &&
          products.length < 8 &&
          firstToken &&
          firstToken !== normalizedQuery
        ) {
          const extraProducts = await queryFallback(firstToken);
          if (current !== productSearchSeqRef.current) return;
          if (extraProducts.length) products = [...products, ...extraProducts];
        }

        let options = normalizeProductOptions(products.map(mapProductOption));
        const shouldMergeBrandOptions = !brandId && q.length >= 3;
        if (shouldMergeBrandOptions) {
          const fromBrandKeyword = await queryProductsByBrandKeyword(q);
          if (current !== productSearchSeqRef.current) return;
          if (fromBrandKeyword.length) {
            options = normalizeProductOptions(
              [...products, ...fromBrandKeyword].map(mapProductOption),
            );
          }
        }
        putCache(
          productOptionsCacheRef,
          cacheKey,
          options.map((opt) => ({ ...opt })),
        );
        persistProductMeta(options);
      } catch (e2: any) {
        if (current !== productSearchSeqRef.current) return;
        message.error(
          e2?.response?.data?.message ??
          e1?.response?.data?.message ??
          "Gagal ambil produk",
        );
      }
    } finally {
      if (current === productSearchSeqRef.current) setProductLoading(false);
    }
  };

  const searchBrands = async (keyword: string) => {
    const q = String(keyword ?? "").trim();
    setBrandLoading(true);
    try {
      const resp: any = await getDiscountOptionBrands({
        q,
        page: 1,
        per_page: 20,
      });
      const list = resp?.data?.serve?.data ?? [];
      setBrandOptions(
        list.map((b: any) => ({
          value: Number(b.id),
          label: String(b.name ?? "Brand"),
        })),
      );
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal ambil brand");
    } finally {
      setBrandLoading(false);
    }
  };

  const fetchProductsMetaByIds = async (productIds: number[]) => {
    const ids = Array.from(new Set(productIds.filter((x) => x > 0)));
    if (!ids.length) return {} as Record<number, ProductMeta>;

    try {
      const resp: any = await getDiscountOptionProducts({
        ids: ids.join(","),
      });
      const list = resp?.data?.serve?.data ?? [];
      const metaMap: Record<number, ProductMeta> = {};
      for (const p of list) {
        const pid = Number(p?.id ?? 0);
        if (!pid) continue;
        metaMap[pid] = {
          productId: pid,
          productName: String(p?.name ?? `Produk ${pid}`),
          brandId: p?.brandId ?? p?.brand_id ?? null,
          brandName: String(p?.brandName ?? p?.brand_name ?? ""),
          isSale: toBoolFlag(p?.isSale ?? p?.is_sale ?? 0),
          isFlashSale: toBoolFlag(p?.isFlashSale ?? p?.is_flash_sale ?? 0),
          image: p?.image ?? p?.path ?? null,
        };
      }
      setProductMetaById((prev) => {
        const next = { ...prev };
        for (const [pidStr, meta] of Object.entries(metaMap)) {
          const pid = Number(pidStr);
          if (!pid) continue;
          next[pid] = meta;
        }
        return next;
      });
      setProductNameById((prev) => {
        const next = { ...prev };
        for (const [pidStr, meta] of Object.entries(metaMap)) {
          const pid = Number(pidStr);
          if (!pid) continue;
          next[pid] = String(meta?.productName ?? `Produk ${pid}`);
        }
        return next;
      });
      return metaMap;
    } catch {
      return {} as Record<number, ProductMeta>;
    }
  };

  const fetchProductVariants = async (productId: number) => {
    const resp: any = await getDiscountOptionProductVariants({
      product_id: productId,
    });
    const data = resp?.data?.serve?.data ?? [];
    return data as Array<{
      product_variant_id: number;
      product_id: number;
      sku: string | null;
      price: number;
      stock: number;
      label: string;
      image?: string | null;
    }>;
  };

  const fetchProductVariantsByProductIds = async (
    productIds: number[],
  ): Promise<Map<number, VariantApiRow[]>> => {
    const ids = Array.from(new Set(productIds.map((x) => Number(x)).filter((x) => x > 0)));
    const grouped = new Map<number, VariantApiRow[]>();
    if (!ids.length) return grouped;

    const chunkSize = 200;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const resp: any = await getDiscountOptionProducts({
        ids: chunk.join(","),
        with_variants: 1,
      });
      const products = Array.isArray(resp?.data?.serve?.data)
        ? resp.data.serve.data
        : [];

      products.forEach((product: any) => {
        const pid = Number(product?.id ?? 0);
        if (!pid) return;
        const rows = Array.isArray(product?.variants) ? product.variants : [];
        grouped.set(pid, rows);
      });
    }

    return grouped;
  };

  const searchVariants = async (keyword: string, productId?: number | null) => {
    const q = String(keyword ?? "").trim();
    const pid = Number(productId ?? 0);
    const cacheKey = `variant:${pid}:${normalizeSearchText(q)}`;
    const cached = variantOptionsCacheRef.current.get(cacheKey);
    if (cached) {
      setVariantOptions(cached.map((opt) => ({ ...opt })));
      setVariantLoading(false);
      return;
    }
    const current = ++variantSearchSeqRef.current;
    if (q) setVariantOptions([]);
    setVariantLoading(true);
    try {
      const pageSize = 200;
      const maxPages = 20;

      const queryApiPage = async (query: string, page = 1) => {
        const resp: any = await getDiscountOptionProductVariants({
          ...(pid ? { product_id: pid } : {}),
          q: query,
          page,
          per_page: pageSize,
        });
        return (resp?.data?.serve?.data ?? []) as any[];
      };

      const queryApi = async (query: string) => {
        if (!query) {
          return await queryApiPage(query, 1);
        }

        const all: any[] = [];
        for (let page = 1; page <= maxPages; page += 1) {
          const rows = await queryApiPage(query, page);
          if (!Array.isArray(rows) || !rows.length) break;
          all.push(...rows);
          if (rows.length < pageSize) break;
        }
        return all;
      };

      let list = await queryApi(q);
      if (current !== variantSearchSeqRef.current) return;
      const qTokens = splitSearchTokens(q);
      const firstToken = qTokens[0] ?? "";
      const normalizedQuery = normalizeSearchText(q);

      // Fallback server query for multi-keyword input.
      if (q && qTokens.length > 1 && list.length < 8 && firstToken && firstToken !== normalizedQuery) {
        const extraList = await queryApi(firstToken);
        if (extraList.length) list = [...list, ...extraList];

        if (!list.length) {
          const secondToken = qTokens.find((token, idx) => idx > 0 && token.length >= 3);
          if (secondToken && secondToken !== firstToken) {
            const secondList = await queryApi(secondToken);
            if (secondList.length) list = [...list, ...secondList];
          }
        }
        if (current !== variantSearchSeqRef.current) return;
      }

      const mapped = list
        .map((v: any) => {
          const variantId = Number(v?.product_variant_id ?? v?.id ?? 0);
          if (!variantId) return null;
          return {
            value: variantId,
            label: composeVariantLabel(v, variantId),
            productId: Number(v?.product_id ?? 0) || undefined,
          };
        })
        .filter(Boolean) as {
        value: number;
        label: string;
        productId?: number;
      }[];

      const filtered = q
        ? mapped.filter((opt) => isLooseMatch(String(opt.label ?? ""), q))
        : mapped;

      const fallbackTokens = qTokens.filter((token) => token.length >= 2);
      const broadFiltered =
        q && filtered.length === 0 && fallbackTokens.length > 0
          ? mapped.filter((opt) => {
            const label = normalizeSearchText(String(opt.label ?? ""));
            return fallbackTokens.some((token) => label.includes(token));
          })
          : filtered;

      const uniqueById = new Map<number, VariantOption>();
      broadFiltered.forEach((opt) => {
        if (!uniqueById.has(opt.value)) uniqueById.set(opt.value, opt);
      });
      if (current !== variantSearchSeqRef.current) return;
      const resolved = Array.from(uniqueById.values());
      putCache(
        variantOptionsCacheRef,
        cacheKey,
        resolved.map((opt) => ({ ...opt })),
      );
      setVariantOptions(resolved);
    } catch (e: any) {
      if (current !== variantSearchSeqRef.current) return;
      message.error(e?.response?.data?.message ?? "Gagal ambil varian");
    } finally {
      if (current === variantSearchSeqRef.current) setVariantLoading(false);
    }
  };

  const fetchProductVariantsByIds = async (variantIds: number[]) => {
    const ids = Array.from(new Set(variantIds.filter((x) => x > 0)));
    if (!ids.length) return {} as Record<
      number,
      {
        product_variant_id: number;
        product_id: number;
        sku: string | null;
        price: number;
        stock: number;
        label: string;
        image?: string | null;
      }
    >;

    const resp: any = await getDiscountOptionProductVariants({
      variant_ids: ids.join(","),
    });
    const data = resp?.data?.serve?.data ?? [];
    const map: Record<
      number,
      {
        product_variant_id: number;
        product_id: number;
        sku: string | null;
        price: number;
        stock: number;
        label: string;
        image?: string | null;
      }
    > = {};

    for (const v of data) {
      const pvId = Number(v?.product_variant_id ?? 0);
      if (!pvId) continue;
      map[pvId] = {
        product_variant_id: pvId,
        product_id: Number(v?.product_id ?? 0),
        sku: v?.sku ?? null,
        price: Number(v?.price ?? 0),
        stock: Number(v?.stock ?? 0),
        label: composeVariantLabel(v, pvId),
        image: v?.image ?? null,
      };
    }

    return map;
  };

  const fetchProductName = async (productId: number): Promise<string> => {
    if (productNameById[productId]) return productNameById[productId];

    const candidates = [
      `/admin/product/${productId}`,
      `/admin/products/${productId}`,
      `/admin/product/show/${productId}`,
    ];

    for (const url of candidates) {
      try {
        const resp: any = await getDiscountProductDetailByUrl(url);
        const s = resp?.data?.serve ?? resp?.data?.data ?? resp?.data;
        const nm = String(s?.name ?? "").trim();
        if (nm) return nm;
      } catch {
        // ignore
      }
    }

    return `Produk ${productId}`;
  };

  const addProductsToVariants = async (
    productIds: number[],
    selectedNameMap?: Record<number, string>,
    metaOverride?: Record<number, ProductMeta>,
    options?: AddProductsOptions,
  ): Promise<VariantRow[] | null> => {
    const metaSource = metaOverride ?? productMetaById;
    const blockProductsOnSale = Boolean(options?.blockProductsOnSale);
    const defaults = options?.defaults;
    const uniqueIds = Array.from(
      new Set(productIds.map((x) => Number(x)).filter((x) => x > 0)),
    );
    if (!uniqueIds.length) return null;

    const blocked: ProductMeta[] = [];
    const allowedIds: number[] = [];

    for (const pid of uniqueIds) {
      const meta = metaSource[pid];
      const name =
        selectedNameMap?.[pid] ?? meta?.productName ?? `Produk ${pid}`;
      const normalized: ProductMeta = {
        productId: pid,
        productName: name,
        brandId: meta?.brandId ?? null,
        brandName: meta?.brandName ?? "",
        isSale: Boolean(meta?.isSale),
        isFlashSale: Boolean(meta?.isFlashSale),
      };

      if (
        blockProductsOnSale &&
        (normalized.isSale || normalized.isFlashSale)
      ) {
        blocked.push(normalized);
      } else {
        allowedIds.push(pid);
      }
    }

    if (blocked.length && allowedIds.length === 0) {
      message.error(
        "Produk sedang dalam keadaan sale/flash sale dan tidak dapat dilanjut.",
      );
      return null;
    }

    if (blocked.length) {
      message.warning(
        `${blocked.length} produk sedang sale/flash sale dan tidak ikut ditambahkan.`,
      );
    }

    setLoading(true);
    try {
      const rowsList: Array<{ productId: number; rows: any[] }> = [];
      const failedIds: number[] = [];
      let skippedVariantCount = 0;
      const filterBlockedVariants = (rows: VariantApiRow[]) =>
        rows.filter((v) => {
          const isSaleVariant = toBoolFlag(
            v?.isSale ??
              v?.is_sale ??
              v?.sale ??
              v?.on_sale ??
              v?.sale_status ??
              0,
          );
          const isFlashSaleVariant = toBoolFlag(
            v?.isFlashSale ??
              v?.is_flash_sale ??
              v?.flash_sale ??
              v?.on_flash_sale ??
              v?.flashsale ??
              0,
          );
          if (isSaleVariant || isFlashSaleVariant) {
            skippedVariantCount += 1;
            return false;
          }
          return true;
        });

      const unresolvedIds = new Set<number>(allowedIds);
      try {
        const bulkGrouped = await fetchProductVariantsByProductIds(allowedIds);
        bulkGrouped.forEach((rows, pid) => {
          rowsList.push({
            productId: pid,
            rows: filterBlockedVariants(rows),
          });
          unresolvedIds.delete(pid);
        });
      } catch {
        // fallback ke request per produk jika endpoint batch gagal
      }

      const remainingIds = Array.from(unresolvedIds);
      const chunkSize = 10;
      for (let i = 0; i < remainingIds.length; i += chunkSize) {
        const slice = remainingIds.slice(i, i + chunkSize);
        const chunkResults = await Promise.allSettled(
          slice.map(async (pid) => ({
            productId: pid,
            rows: await fetchProductVariants(pid),
          })),
        );

        chunkResults.forEach((res, idx) => {
          if (res.status === "fulfilled") {
            rowsList.push({
              productId: res.value.productId,
              rows: filterBlockedVariants(res.value?.rows ?? []),
            });
          } else {
            const pid = slice[idx];
            if (pid) failedIds.push(pid);
          }
        });
      }

      if (!rowsList.length) {
        message.error("Gagal ambil varian produk");
        return null;
      }

      const nameMap: Record<number, string> = {};
      for (const { productId: pid, rows } of rowsList) {
        if (!rows || !rows.length) continue;
        const name =
          selectedNameMap?.[pid] ||
          productMetaById[pid]?.productName ||
          (await fetchProductName(pid)) ||
          `Produk ${pid}`;
        nameMap[pid] = name;
      }

      setProductNameById((prev) => ({ ...prev, ...nameMap }));

      const currentVariants = getVariants();
      const map = new Map<number, VariantRow>();
      for (const r of currentVariants) map.set(r.productVariantId, r);

      for (const entry of rowsList) {
        const pid = entry.productId;
        if (!entry.rows || entry.rows.length === 0) continue;
        const pname = nameMap[pid] ?? `Produk ${pid}`;
        const meta = metaSource[pid];

        for (const v of entry.rows) {
          const pvId = Number(v.product_variant_id);
          if (!pvId) continue;
          if (map.has(pvId)) continue;

          const basePrice = Number(v.price ?? 0);
          const stock = Number(v.stock ?? 0);
          const label = composeVariantLabel(v, pvId, {
            brandName: meta?.brandName ?? "",
            productName: pname,
          });
          const applyDefaultDiscount =
            defaults?.discountPercent !== null &&
            defaults?.discountPercent !== undefined &&
            Number(defaults.discountPercent) > 0;
          const pct = applyDefaultDiscount
            ? Math.min(100, Math.max(0, Math.round(Number(defaults.discountPercent))))
            : null;
          const discounted =
            pct !== null
              ? Math.round((basePrice * (100 - pct)) / 100)
              : null;
          const finalPrice =
            discounted !== null
              ? Math.min(basePrice, Math.max(0, discounted))
              : null;

          map.set(pvId, {
            productVariantId: pvId,
            productId: Number(v.product_id) || pid,
            brandId: meta?.brandId ?? null,
            brandName: meta?.brandName ?? "",
            productName: pname,
            sku: v.sku ?? null,

            label,
            variantName: prettyVariantName(label),

            basePrice,
            stock,

            isActive: true,

            discountPrice: finalPrice,
            discountPercent: pct,
            lastEdited: pct !== null ? "percent" : null,

            promoStock:
              defaults?.promoStock !== null &&
              defaults?.promoStock !== undefined &&
              Number(defaults.promoStock) > 0
                ? Math.round(Number(defaults.promoStock))
                : null,
            purchaseLimit: null,
            maxDiscount:
              defaults?.maxDiscount !== null &&
              defaults?.maxDiscount !== undefined &&
              Number(defaults.maxDiscount) > 0
                ? Number(defaults.maxDiscount)
                : null,
            image: v.image ?? meta?.image ?? null,
          });
        }
      }

      const nextList = Array.from(map.values()).sort((a, b) => {
        if (a.productId !== b.productId) return a.productId - b.productId;
        return a.productVariantId - b.productVariantId;
      });
      setVariants(nextList);

      if (!nextList.length) {
        message.error("Tidak ada varian untuk diproses.");
        return null;
      }

      if (skippedVariantCount > 0 && !blockProductsOnSale) {
        message.warning(
          `${skippedVariantCount} varian sedang sale/flash sale dan dilewati.`,
        );
      }

      if (failedIds.length) {
        message.warning(
          `${failedIds.length} produk gagal diambil variannya dan tidak ditambahkan.`,
        );
      }
      message.success("Produk berhasil ditambahkan");
      return nextList;
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal ambil varian produk");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addProductToVariants = async (
    productId: number,
    productName: string,
    options?: AddProductsOptions,
  ) => {
    const selectedNameMap: Record<number, string> = {
      [productId]: productName,
    };
    return await addProductsToVariants([productId], selectedNameMap, undefined, options);
  };

  const addVariantsToVariants = async (variantIds: number[]) => {
    const ids = Array.from(new Set(variantIds.map(Number).filter((v) => v > 0)));
    if (!ids.length) return null;

    setLoading(true);
    try {
      const variantMap = await fetchProductVariantsByIds(ids);
      const productIds = Array.from(
        new Set(
          Object.values(variantMap)
            .map((v) => Number(v?.product_id ?? 0))
            .filter(Boolean),
        ),
      );

      const metaMap = await fetchProductsMetaByIds(productIds);
      const nameMap: Record<number, string> = {};
      for (const pid of productIds) {
        const meta = metaMap[pid];
        if (meta?.productName) nameMap[pid] = meta.productName;
      }
      setProductNameById((prev) => ({ ...prev, ...nameMap }));

      const current = getVariants();
      const currentMap = new Map<number, VariantRow>();
      for (const v of current) currentMap.set(v.productVariantId, v);

      const added: VariantRow[] = [];
      for (const id of ids) {
        if (currentMap.has(id)) continue;
        const v = variantMap[id];
        if (!v) continue;
        const pid = Number(v.product_id ?? 0);
        const meta = metaMap[pid] ?? productMetaById[pid];
        const productName =
          meta?.productName ?? productNameById[pid] ?? `Produk ${pid}`;
        const label = composeVariantLabel(v, id, {
          brandName: meta?.brandName ?? "",
          productName,
        });
        added.push({
          productVariantId: id,
          productId: pid,
          brandId: meta?.brandId ?? null,
          brandName: meta?.brandName ?? "",
          productName,
          sku: v.sku ?? null,
          label,
          variantName: prettyVariantName(label),
          basePrice: Number(v.price ?? 0),
          stock: Number(v.stock ?? 0),
          isActive: true,
          discountPrice: null,
          discountPercent: null,
          lastEdited: null,
          promoStock: null,
          purchaseLimit: null,
          maxDiscount: null,
          image: v.image ?? meta?.image ?? null,
        });
      }

      if (!added.length) {
        message.info("Tidak ada varian baru untuk ditambahkan.");
        return null;
      }

      const next = [...current, ...added].sort((a, b) => {
        if (a.productId !== b.productId) return a.productId - b.productId;
        return a.productVariantId - b.productVariantId;
      });
      setVariants(next);
      message.success(`Berhasil menambahkan ${added.length} varian.`);
      return added;
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal menambahkan varian.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProductsMeta = async () => {
    const pageSize = 100;
    const maxPages = 100;
    const all: any[] = [];
    let page = 1;

    while (page <= maxPages) {
      const resp: any = await getDiscountOptionProducts({
        q: "",
        page,
        per_page: pageSize,
        with_variants: 1,
      });
      const list = resp?.data?.serve?.data ?? [];
      if (!Array.isArray(list) || list.length === 0) break;
      all.push(...list);
      if (list.length < pageSize) break;
      page += 1;
      // Small delay to prevent overloading
      await new Promise((r) => setTimeout(r, 100));
    }

    if (page > maxPages) {
      message.warning(
        "Jumlah produk sangat besar. Hanya sebagian produk yang dimuat.",
      );
    }

    return all;
  };

  const addAllProductsToVariants = async () => {
    const all = await fetchAllProductsMeta();
    if (!all.length) {
      message.warning("Tidak ada produk ditemukan.");
      return null;
    }

    const ids: number[] = [];
    const nameMap: Record<number, string> = {};
    const metaMap: Record<number, ProductMeta> = {};
    const allVariants: VariantRow[] = [];
    let skippedDueToSale = 0;

    for (const p of all) {
      const pid = Number(p?.id ?? 0);
      if (!pid) continue;
      const isSale = toBoolFlag(p?.isSale ?? p?.is_sale ?? 0);
      const isFlashSale = toBoolFlag(p?.isFlashSale ?? p?.is_flash_sale ?? 0);

      if (isSale || isFlashSale) {
        skippedDueToSale += 1;
        continue;
      }

      ids.push(pid);
      const meta: ProductMeta = {
        productId: pid,
        productName: String(p?.name ?? `Produk ${pid}`),
        brandId: p?.brandId ?? p?.brand_id ?? null,
        brandName: String(p?.brandName ?? p?.brand_name ?? ""),
        isSale,
        isFlashSale,
        image: p?.image ?? p?.path ?? null,
      };
      nameMap[pid] = meta.productName;
      metaMap[pid] = meta;

      if (p.variants && Array.isArray(p.variants)) {
        for (const v of p.variants) {
          const variantId = Number(v?.product_variant_id ?? 0);
          if (!variantId) continue;
          const label = composeVariantLabel(v, variantId, {
            brandName: meta.brandName ?? "",
            productName: meta.productName,
          });
          allVariants.push({
            productVariantId: variantId,
            productId: pid,
            brandId: meta.brandId,
            brandName: meta.brandName,
            productName: meta.productName,
            sku: v.sku,
            label,
            variantName: prettyVariantName(label),
            basePrice: v.price,
            stock: v.stock,
            isActive: true,
            discountPrice: null,
            discountPercent: null,
            lastEdited: null,
            promoStock: null,
            purchaseLimit: null,
            maxDiscount: null,
            image: meta.image,
          });
        }
      }
    }

    if (skippedDueToSale > 0) {
      message.warning(
        `${skippedDueToSale} produk sale/flash sale dilewati dari mode Semua Product.`,
      );
    }

    if (!ids.length) {
      message.warning("Tidak ada produk eligible untuk promo diskon.");
      return null;
    }

    setProductMetaById((prev) => ({ ...prev, ...metaMap }));
    setProductNameById((prev) => ({ ...prev, ...nameMap }));

    if (allVariants.length > 0) {
      setVariants(allVariants);
      message.success(`Berhasil memuat ${allVariants.length} varian dari ${ids.length} produk.`);
      return allVariants;
    }

    return await addProductsToVariants(ids, nameMap, metaMap, {
      blockProductsOnSale: true,
    });
  };

  const removeProduct = (productId: number) => {
    setVariants((prev) =>
      prev.filter((v) => Number(v.productId) !== Number(productId)),
    );
    setSelectedVariantIds([]);
  };

  return {
    searchProducts,
    searchBrands,
    searchVariants,
    fetchProductsMetaByIds,
    fetchProductVariants,
    fetchProductVariantsByIds,
    fetchProductName,
    addProductsToVariants,
    addVariantsToVariants,
    addProductToVariants,
    addAllProductsToVariants,
    removeProduct,
  };
};
