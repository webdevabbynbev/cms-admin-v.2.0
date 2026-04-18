import React, { useState, useEffect, useMemo, useRef } from "react";
import { Form, message, notification } from "antd";
import type { FormInstance } from "antd";
import dayjs from "dayjs";
import http from "../../api/http";
import { createFlashSale, updateFlashSale } from "../../api/flash-sale";
import type {
  FlashSaleRecord,
  VariantRow,
  FlashSaleVariantInput,
  FormValues,
} from "../../components/Forms/FlashSale/flashTypes";

const DATE_FMT = "YYYY-MM-DD HH:mm:ss";

// --- Helpers ---
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const isSkuLike = (value: string) => {
  const v = String(value ?? "")
    .trim()
    .replace(/^SKU\s*:?\s*/i, "");
  if (!v) return false;
  // Typical SKU patterns like AB-WD-BGJ-0C50
  if (/^[A-Z0-9]+(?:-[A-Z0-9]+){1,}$/i.test(v)) return true;
  // Barcode-like numeric tokens (EAN/UPC/etc), e.g. 8999137708319
  if (/^\d{8,}$/.test(v)) return true;
  return false;
};

const sanitizeVariantPart = (value: string, fallbackId: number) => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallbackId > 0 ? `VAR-${fallbackId}` : "Varian";

  const withoutSkuTag = raw.replace(/\bSKU\s*:\s*[A-Z0-9-]+\b/gi, "").trim();
  const parts = withoutSkuTag
    .split(" - ")
    .map((p) => p.trim())
    .filter(Boolean);

  if (!parts.length) return fallbackId > 0 ? `VAR-${fallbackId}` : "Varian";
  if (parts.length === 1) {
    if (isSkuLike(parts[0])) {
      return fallbackId > 0 ? `VAR-${fallbackId}` : "Varian";
    }
    return parts[0];
  }
  if (isSkuLike(parts[0])) return parts.slice(1).join(" - ");
  return parts.join(" - ");
};

const sanitizeFullVariantLabel = (value: string, fallbackVariantId = 0) => {
  const raw = String(value ?? "")
    .replace(/\s*SKU\s*:.*$/i, "")
    .trim();
  if (!raw) return fallbackVariantId > 0 ? `VAR-${fallbackVariantId}` : "Varian";

  const parts = raw
    .split(" - ")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 3 && isSkuLike(parts[2])) {
    parts.splice(2, 1);
  }

  if (parts.length >= 2 && isSkuLike(parts[0])) {
    parts.shift();
  }

  if (!parts.length) return fallbackVariantId > 0 ? `VAR-${fallbackVariantId}` : "Varian";
  return parts.join(" - ");
};

const buildVariantLabel = (
  variant: any,
  variantId: number,
  options?: { allowSkuFallback?: boolean },
) => {
  const allowSkuFallback = options?.allowSkuFallback === true;
  const directLabel = String(
    variant?.label ?? variant?.variantLabel ?? variant?.variant_label ?? "",
  ).trim();
  if (directLabel) return sanitizeVariantPart(directLabel, variantId);

  if (Array.isArray(variant?.attributes) && variant.attributes.length > 0) {
    const sorted = [...variant.attributes].sort((a: any, b: any) => {
      const nameA = String(a?.attribute?.name ?? "").toLowerCase();
      const nameB = String(b?.attribute?.name ?? "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const values = sorted
      .map((a: any) => String(a?.value ?? a?.attribute_value ?? "").trim())
      .filter(Boolean);

    if (values.length) return sanitizeVariantPart(values.join(" / "), variantId);
  }
  if (variant?.name) return sanitizeVariantPart(String(variant.name), variantId);
  if (allowSkuFallback && variant?.sku) {
    return sanitizeVariantPart(String(variant.sku), variantId);
  }
  return `VAR-${variantId}`;
};

const buildBaseProductLabel = (brandName: string, productName: string) => {
  const b = String(brandName ?? "").trim();
  const p = String(productName ?? "").trim();
  if (!b) return p || "Produk";
  return `${b} - ${p}`;
};

const buildFullVariantLabel = (
  brandName: string,
  productName: string,
  variantLabel: string,
) => {
  const base = buildBaseProductLabel(brandName, productName);
  const v = sanitizeVariantPart(String(variantLabel ?? "").trim(), 0);
  return `${base} - ${v}`;
};

const pickMediaUrl = (medias?: any[]) => {
  if (!Array.isArray(medias) || medias.length === 0) return null;
  const main = medias.find((m: any) => Number(m?.type ?? 0) === 1);
  return (main?.url ?? medias[0]?.url ?? null) as string | null;
};

const resolveVariantImage = (variant: any, product: any) => {
  return (
    pickMediaUrl(variant?.medias) ||
    pickMediaUrl(product?.medias) ||
    variant?.image_url ||
    variant?.image ||
    product?.image_url ||
    product?.image ||
    product?.path ||
    null
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

const buildProductSearchText = (product: any, renderedLabel: string) => {
  const productName = String(product?.name ?? "Produk").trim() || "Produk";
  const brandName = String(
    product?.brandName ?? product?.brand_name ?? product?.brand?.name ?? "",
  ).trim();

  return [
    buildBaseProductLabel(brandName, productName),
    `${brandName} ${productName}`.trim(),
    `${productName} ${brandName}`.trim(),
    String(renderedLabel ?? "").trim(),
  ]
    .filter(Boolean)
    .join(" | ");
};

// Hitung % dari harga
const computeFromPercent = (basePrice: number, percent: number) => {
  const pct = clamp(Math.round(percent), 0, 100);
  const discounted = Math.round((basePrice * (100 - pct)) / 100);
  return { pct, discounted: clamp(discounted, 0, basePrice) };
};

// Hitung harga dari nominal
const computeFromPrice = (basePrice: number, price: number) => {
  const p = clamp(Math.round(price), 0, basePrice);
  const pct =
    basePrice > 0 ? Math.round(((basePrice - p) / basePrice) * 100) : 0;
  return { p, pct: clamp(pct, 0, 100) };
};

const resolveVariantStock = (variant: any) => {
  const channelStocks =
    variant?.channelStocks ??
    variant?.channel_stocks ??
    variant?.channelStock ??
    variant?.channel_stock ??
    [];
  const arr = Array.isArray(channelStocks) ? channelStocks : [];
  const websiteRow = arr.find((row: any) => {
    const channel = String(row?.channel ?? row?.channel_name ?? "").toLowerCase();
    return channel === "website";
  });

  if (websiteRow) {
    const stock = toNumber(websiteRow?.stock ?? 0, 0);
    const reserved = toNumber(websiteRow?.reservedStock ?? websiteRow?.reserved_stock ?? 0, 0);
    return Math.max(0, stock - reserved);
  }

  return toNumber(variant?.stock ?? variant?.baseStock ?? 0, 0);
};

const parsePromoConflictLines = (rawMessage: unknown) => {
  if (typeof rawMessage !== "string") return [];
  const lines = rawMessage
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const conflicts = lines.filter((l) =>
    l.toLowerCase().includes("already has active"),
  );
  return conflicts.length ? conflicts : [];
};

const parseStatusFlag = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "n", "off", ""].includes(normalized)) return false;
  }
  return false;
};

type UseFormFlashSaleProps = {
  data?: FlashSaleRecord | null;
  form: FormInstance;
  flashSaleId?: number;
  onLoadingChange?: (loading: boolean) => void;
  handleClose: () => void;
};

const useFormFlashSale = ({
  data,
  form,
  flashSaleId,
  onLoadingChange,
  handleClose,
}: UseFormFlashSaleProps) => {
  const [loading, setLoading] = useState(false);
  const hasButton = Form.useWatch("has_button", form);
  const editId = toNumber(data?.id ?? flashSaleId ?? 0);

  // State Produk & Varian
  const [productOptions, setProductOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [productLoading, setProductLoading] = useState(false);
  const searchSeq = useRef(0);
  const brandProductSearchSeq = useRef(0);
  const variantSearchSeq = useRef(0);
  const productOptionsCacheRef = useRef<
    Map<string, { label: string; value: number }[]>
  >(new Map());
  const brandProductOptionsCacheRef = useRef<
    Map<string, { label: string; value: number }[]>
  >(new Map());
  const variantGlobalOptionsCacheRef = useRef<
    Map<string, { label: string; value: number; productId?: number }[]>
  >(new Map());
  const [inputMode, setInputMode] = useState<"product" | "brand" | "variant">(
    "product",
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [brandOptions, setBrandOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [brandProductOptions, setBrandProductOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const [brandPage, setBrandPage] = useState(1);
  const [brandHasMore, setBrandHasMore] = useState(true);
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [selectedBrandNameMap, setSelectedBrandNameMap] = useState<
    Record<number, string>
  >({});
  const [brandProductIdsMap, setBrandProductIdsMap] = useState<
    Record<number, number[]>
  >({});
  const [variantOptions, setVariantOptions] = useState<
    { label: string; value: number; productId?: number }[]
  >([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [selectedVariantIdsToAdd, setSelectedVariantIdsToAdd] = useState<
    number[]
  >([]);
  const variantOptionsCache = useRef<
    Map<number, { options: { label: string; value: number }[] }>
  >(new Map());

  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const promoStatusCache = useRef(
    new Map<number, { isSale: boolean; isFlashSale: boolean }>(),
  );

  // State Bulk
  const [bulkPercent, setBulkPercent] = useState<number | null>(null);
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkStock, setBulkStock] = useState<number | null>(null);

  // Update loading parent wrapper
  useEffect(() => {
    if (onLoadingChange) onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  // ============================================================
  // LOAD DATA (EDIT MODE)
  // ============================================================
  useEffect(() => {
    if (!data) {
      form.setFieldsValue({
        title: "",
        description: "",
        has_button: false,
        button_text: null,
        button_url: null,
        start_datetime: dayjs(),
        end_datetime: dayjs().add(1, "day"),
        is_publish: false,
      });
      setVariants([]);
      return;
    }

    let cancelled = false;

    form.setFieldsValue({
      title: data.title ?? "",
      description: data.description ?? "",
      has_button: Boolean(data.hasButton),
      button_text: data.buttonText ?? null,
      button_url: data.buttonUrl ?? null,
      start_datetime: data.startDatetime ? dayjs(data.startDatetime) : dayjs(),
      end_datetime: data.endDatetime
        ? dayjs(data.endDatetime)
        : dayjs().add(1, "day"),
      is_publish: Boolean(data.isPublish),
    });

    const loadedVariants: VariantRow[] = [];
    const missingVariantRefs: Array<{ productId: number; variantId: number }> =
      [];

    const buildVariantRow = (
      variant: any,
      productMeta: any,
      promoMeta: any,
    ): VariantRow | null => {
      const vid = toNumber(
        variant?.id ??
          variant?.variant_id ??
          variant?.product_variant_id ??
          promoMeta?.product_variant_id ??
          promoMeta?.variant_id ??
          0,
      );
      if (!vid) return null;

      const pid = toNumber(
        productMeta?.id ?? variant?.product_id ?? promoMeta?.product_id ?? 0,
      );

      const basePrice = toNumber(
        variant?.price ?? variant?.base_price ?? variant?.product?.price ?? 0,
      );

      const baseStock = toNumber(
        variant?.stock ?? variant?.base_stock ?? variant?.product?.stock ?? 0,
      );

      const hasVariantLabel = (() => {
        const directLabel = String(
          variant?.label ?? variant?.variantLabel ?? variant?.variant_label ?? "",
        ).trim();
        if (directLabel) return true;
        if (Array.isArray(variant?.attributes) && variant.attributes.length > 0) {
          return true;
        }
        if (variant?.name) return true;
        return false;
      })();

      const flashPriceRaw =
        promoMeta?.flash_price ??
        promoMeta?.pivot?.flash_price ??
        variant?.pivot?.flash_price ??
        variant?.flash_price ??
        basePrice;

      const flashStockRaw =
        promoMeta?.stock ??
        promoMeta?.quota ??
        promoMeta?.pivot?.stock ??
        variant?.pivot?.stock ??
        variant?.flash_stock ??
        0;

      const flashPrice = toNumber(flashPriceRaw, basePrice);
      const flashStock = toNumber(flashStockRaw, 0);
      const { pct } = computeFromPrice(basePrice, flashPrice);

      const label = buildVariantLabel(variant, vid, { allowSkuFallback: false });
      const image = resolveVariantImage(variant, productMeta);
      if (!hasVariantLabel || !image) {
        missingVariantRefs.push({ productId: pid, variantId: vid });
      }

      const productNameRaw =
        productMeta?.name ??
        variant?.product_name ??
        variant?.product?.name ??
        `Product #${pid}`;
      const brandName =
        productMeta?.brand?.name ??
        productMeta?.brandName ??
        productMeta?.brand_name ??
        variant?.product?.brand?.name ??
        "";
      const productName = buildBaseProductLabel(brandName, productNameRaw);

      return {
        variantId: vid,
        productId: pid,
        productName,
        sku: variant?.sku ?? null,
        image,
        label: buildFullVariantLabel(
          brandName,
          productNameRaw,
          label,
        ),
        basePrice,
        baseStock,
        flashPrice,
        flashPercent: pct,
        flashStock,
        isActive: true,
      };
    };

    const fromVariants =
      (data.variants?.length ? data.variants : data.products) ?? [];
    if (Array.isArray(fromVariants)) {
      fromVariants.forEach((v: any) => {
        const productObj = v.product ?? {};
        const pivotData = v.pivot ?? v;
        const row = buildVariantRow(v, productObj, pivotData);
        if (row) loadedVariants.push(row);
      });
    }

    const seen = new Set<number>();
    const unique = loadedVariants.filter((row) => {
      if (seen.has(row.variantId)) return false;
      seen.add(row.variantId);
      return true;
    });

    setVariants(unique);

    const missingSet = new Set(
      missingVariantRefs.map((row) => Number(row.variantId)).filter((id) => id),
    );
    const missingProductIds = Array.from(
      new Set(missingVariantRefs.map((row) => Number(row.productId)).filter((id) => id)),
    );

    if (missingSet.size && missingProductIds.length) {
      (async () => {
        const responses = await Promise.allSettled(
          missingProductIds.map(async (pid) => ({
            productId: pid,
            data: await fetchProductVariants(pid),
          })),
        );

        if (cancelled) return;

        const metaMap = new Map<
          number,
          { label?: string; image?: string | null; sku?: string | null }
        >();

        responses.forEach((res) => {
          if (res.status !== "fulfilled" || !res.value?.data) return;
          const productData = res.value.data;
          const pnameRaw =
            productData?.name ??
            productData?.product_name ??
            productData?.title ??
            `Product ${res.value.productId}`;
          const brandName =
            productData?.brand?.name ??
            productData?.brandName ??
            productData?.brand_name ??
            "";
          const rows = Array.isArray(productData?.variants)
            ? productData.variants
            : [];

          rows.forEach((v: any) => {
            const vid = toNumber(
              v?.id ?? v?.product_variant_id ?? v?.variant_id ?? 0,
              0,
            );
            if (!vid) return;
            if (!missingSet.has(vid)) return;
            const variantLabel = buildVariantLabel(v, vid, {
              allowSkuFallback: false,
            });
            const label = buildFullVariantLabel(
              brandName,
              pnameRaw,
              variantLabel,
            );
            metaMap.set(vid, {
              label,
              image: resolveVariantImage(v, productData),
              sku: v?.sku ?? null,
            });
          });
        });

        if (!metaMap.size) return;

        setVariants((prev) =>
          prev.map((row) => {
            if (!missingSet.has(row.variantId)) return row;
            const meta = metaMap.get(row.variantId);
            if (!meta) return row;
            return {
              ...row,
              label: meta.label ?? row.label,
              image: meta.image ?? row.image,
              sku: meta.sku ?? row.sku,
            };
          }),
        );
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [data, form]);

  const putCache = <T,>(
    cacheRef: React.MutableRefObject<Map<string, T>>,
    key: string,
    value: T,
  ) => {
    const cache = cacheRef.current;
    cache.set(key, value);
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }
  };

  // --- API Functions ---
  const searchProducts = async (keyword: string) => {
    const q = String(keyword ?? "").trim();
    const qTokens = splitSearchTokens(q);
    const normalizedQuery = normalizeSearchText(q);
    const firstToken = qTokens[0] ?? "";
    const current = ++searchSeq.current;
    const productCacheKey = `product:${inputMode}:${normalizeSearchText(q)}`;
    const cached = productOptionsCacheRef.current.get(productCacheKey);
    if (cached) {
      setProductOptions(cached.map((opt) => ({ ...opt })));
      setProductLoading(false);
      return;
    }
    if (q) setProductOptions([]);
    setProductLoading(true);
    try {
      const isPerProductMode = inputMode === "product";
      const buildProductLabel = (p: any) => {
        const name = String(p?.name ?? "Produk").trim() || "Produk";
        const brand = String(
          p?.brandName ?? p?.brand_name ?? p?.brand?.name ?? "",
        ).trim();
        const baseLabel = buildBaseProductLabel(brand, name);
        if (isPerProductMode) return baseLabel;

        const parts = [baseLabel];
        return parts.join(" > ");
      };

      const fetchList = async (query: string) => {
        if (isPerProductMode) {
          try {
            const respByName: any = await http.get(
              `/admin/product?name=${encodeURIComponent(
                query,
              )}&page=1&per_page=50`,
            );
            return respByName?.data?.serve?.data ?? respByName?.data?.serve ?? [];
          } catch {
            const respByQ: any = await http.get(
              `/admin/product?q=${encodeURIComponent(
                query,
              )}&page=1&per_page=50`,
            );
            return respByQ?.data?.serve?.data ?? respByQ?.data?.serve ?? [];
          }
        }

        try {
          const resp: any = await http.get(
            `/admin/product?q=${encodeURIComponent(query)}&page=1&per_page=50`,
          );
          return resp?.data?.serve?.data ?? resp?.data?.serve ?? [];
        } catch {
          const resp2: any = await http.get(
            `/admin/product?name=${encodeURIComponent(
              query,
            )}&page=1&per_page=50`,
          );
          return resp2?.data?.serve?.data ?? resp2?.data?.serve ?? [];
        }
      };

      const queryProductsByBrandKeyword = async (keywordValue: string) => {
        const brandKeyword = String(keywordValue ?? "").trim();
        if (!brandKeyword || !isPerProductMode) return [] as any[];

        try {
          const brandsResp: any = await http.get(
            `/admin/discount-options/brands?q=${encodeURIComponent(
              brandKeyword,
            )}&page=1&per_page=8`,
          );
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
            const resp: any = await http.get(
              `/admin/discount-options/products?q=&brand_id=${encodeURIComponent(
                String(bid),
              )}&load_all=1`,
            );
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

      let list = await fetchList(q);
      if (current !== searchSeq.current) return;
      if (
        q &&
        qTokens.length > 1 &&
        list.length < 8 &&
        firstToken &&
        firstToken !== normalizedQuery
      ) {
        const extraList = await fetchList(firstToken);
        if (current !== searchSeq.current) return;
        if (extraList.length) list = [...list, ...extraList];

        if (list.length < 8) {
          const secondToken = qTokens.find(
            (token, idx) => idx > 0 && token.length >= 3,
          );
          if (secondToken && secondToken !== firstToken) {
            const secondList = await fetchList(secondToken);
            if (current !== searchSeq.current) return;
            if (secondList.length) list = [...list, ...secondList];
          }
        }
      }

      if (isPerProductMode && q.length >= 3) {
        const byBrand = await queryProductsByBrandKeyword(q);
        if (current !== searchSeq.current) return;
        if (byBrand.length) list = [...list, ...byBrand];
      }

      if (current !== searchSeq.current) return;
      const mappedOptions: {
        value: number;
        label: string;
        searchText: string;
        brandName: string;
      }[] = (list as any[])
        .map((p: any) => {
          const label = buildProductLabel(p);
          return {
            value: toNumber(p?.id, 0),
            label,
            searchText: buildProductSearchText(p, label),
            brandName: String(
              p?.brandName ?? p?.brand_name ?? p?.brand?.name ?? "",
            ),
          };
        })
        .filter(
          (opt: {
            value: number;
            label: string;
            searchText: string;
            brandName: string;
          }) => Number(opt.value) > 0 && String(opt.label).trim(),
        );

      const uniqueById = new Map<
        number,
        { value: number; label: string; searchText: string; brandName: string }
      >();
      mappedOptions.forEach((opt) => {
        const id = Number(opt.value);
        if (!uniqueById.has(id)) uniqueById.set(id, opt);
      });

      let options = Array.from(uniqueById.values());
      if (q) {
        const qNorm = normalizeSearchText(q);
        const qCompact = compactSearchText(q);
        const brandMatchedPool =
          isPerProductMode && qNorm
            ? options.filter((opt) => {
                const brandNorm = normalizeSearchText(opt.brandName);
                const brandCompact = compactSearchText(opt.brandName);
                if (!brandNorm) return false;
                return (
                  brandNorm.includes(qNorm) ||
                  (qCompact ? brandCompact.includes(qCompact) : false)
                );
              })
            : [];
        const basePool =
          brandMatchedPool.length > 0 ? brandMatchedPool : options;

        const strictFiltered = basePool.filter((opt) =>
          isLooseMatch(String(opt.searchText ?? opt.label ?? ""), q),
        );
        const fallbackTokens = qTokens.filter((token) => token.length >= 2);
        options =
          strictFiltered.length > 0
            ? strictFiltered
            : fallbackTokens.length > 0
              ? basePool.filter((opt) => {
                  const searchable = normalizeSearchText(
                    String(opt.searchText ?? opt.label ?? ""),
                  );
                  return fallbackTokens.some((token) =>
                    searchable.includes(token),
                  );
                })
              : basePool;
      }



      const uiOptions = options.map((opt) => ({
        value: Number(opt.value),
        label: opt.label,
      }));
      putCache(
        productOptionsCacheRef,
        productCacheKey,
        uiOptions.map((opt) => ({ ...opt })),
      );
      setProductOptions(uiOptions);
    } catch {
      if (current !== searchSeq.current) return;
      setProductOptions([]);
      message.error({
        content: "Gagal mencari produk",
        key: "product-search",
        duration: 2,
      });
    } finally {
      if (current === searchSeq.current) setProductLoading(false);
    }
  };
  const searchBrands = async (keyword: string) => {
    const q = String(keyword ?? "").trim();
    setBrandQuery(q);
    setBrandPage(1);
    setBrandHasMore(true);
    setBrandLoading(true);
    try {
      const resp: any = await http.get(
        `/admin/discount-options/brands?q=${encodeURIComponent(
          q,
        )}&page=1&per_page=50`,
      );
      const serve = resp?.data?.serve ?? {};
      const list = serve?.data ?? [];
      const currentPage = Number(serve?.currentPage ?? 1);
      const lastPage = Number(serve?.lastPage ?? 1);
      setBrandPage(currentPage);
      setBrandHasMore(currentPage < lastPage);
      setBrandOptions(
        list.map((b: any) => ({
          value: toNumber(b?.id ?? 0),
          label: String(b?.name ?? "Brand"),
        })),
      );
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal ambil brand");
    } finally {
      setBrandLoading(false);
    }
  };

  const loadMoreBrands = async () => {
    if (brandLoading || !brandHasMore) return;
    const nextPage = brandPage + 1;
    setBrandLoading(true);
    try {
      const resp: any = await http.get(
        `/admin/discount-options/brands?q=${encodeURIComponent(
          brandQuery,
        )}&page=${nextPage}&per_page=50`,
      );
      const serve = resp?.data?.serve ?? {};
      const list = serve?.data ?? [];
      const currentPage = Number(serve?.currentPage ?? nextPage);
      const lastPage = Number(serve?.lastPage ?? nextPage);
      setBrandHasMore(currentPage < lastPage);
      setBrandPage(currentPage);
      setBrandOptions((prev) => {
        const map = new Map<number, { label: string; value: number }>();
        prev.forEach((b) => map.set(Number(b.value), b));
        list.forEach((b: any) => {
          const id = toNumber(b?.id ?? 0, 0);
          if (!id) return;
          map.set(id, {
            value: id,
            label: String(b?.name ?? "Brand"),
          });
        });
        return Array.from(map.values());
      });
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal ambil brand");
    } finally {
      setBrandLoading(false);
    }
  };

  const searchBrandProducts = async (
    keyword: string,
    brandId?: number | null,
  ) => {
    const q = String(keyword ?? "").trim();
    const bid = Number(brandId ?? 0);
    const current = ++brandProductSearchSeq.current;
    if (!bid) {
      setBrandProductOptions([]);
      return;
    }
    const cacheKey = `brand-product:${bid}:${normalizeSearchText(q)}`;
    const cached = brandProductOptionsCacheRef.current.get(cacheKey);
    if (cached) {
      setBrandProductOptions(cached.map((opt) => ({ ...opt })));
      setProductLoading(false);
      return;
    }
    if (q) setBrandProductOptions([]);
    setProductLoading(true);
    try {
      const resp: any = await http.get(
        `/admin/discount-options/products?q=${encodeURIComponent(
          q,
        )}&brand_id=${encodeURIComponent(String(bid))}&load_all=1`,
      );
      const list = resp?.data?.serve?.data ?? [];
      if (current !== brandProductSearchSeq.current) return;
      const mapped = (Array.isArray(list) ? list : [])
        .map((p: any) => ({
          value: toNumber(p?.id ?? 0),
          label: String(p?.name ?? "Produk"),
        }))
        .filter((opt: { value: number; label: string }) => opt.value > 0);
      const strictFiltered = q
        ? mapped.filter((opt) => isLooseMatch(String(opt.label ?? ""), q))
        : mapped;
      const fallbackTokens = splitSearchTokens(q).filter((token) => token.length >= 2);
      const filtered =
        q && strictFiltered.length === 0 && fallbackTokens.length > 0
          ? mapped.filter((opt) => {
              const label = normalizeSearchText(String(opt.label ?? ""));
              return fallbackTokens.some((token) => label.includes(token));
            })
          : strictFiltered;
      const uniqueById = new Map<number, { value: number; label: string }>();
      filtered.forEach((opt) => {
        if (!uniqueById.has(opt.value)) uniqueById.set(opt.value, opt);
      });
      const uiOptions = Array.from(uniqueById.values());
      if (current !== brandProductSearchSeq.current) return;
      putCache(
        brandProductOptionsCacheRef,
        cacheKey,
        uiOptions.map((opt) => ({ ...opt })),
      );
      setBrandProductOptions(uiOptions);
    } catch (e: any) {
      if (current !== brandProductSearchSeq.current) return;
      message.error(e?.response?.data?.message ?? "Gagal ambil produk");
    } finally {
      if (current === brandProductSearchSeq.current) setProductLoading(false);
    }
  };

  const addBrandsToVariants = async (
    brandIds: number[],
    brandNameMap?: Record<number, string>,
  ) => {
    const normalizedBrandIds = Array.from(
      new Set(brandIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    if (!normalizedBrandIds.length) {
      message.warning("Pilih minimal 1 brand.");
      return;
    }

    setProductLoading(true);
    try {
      const settled = await Promise.allSettled(
        normalizedBrandIds.map(async (bid) => {
          const resp: any = await http.get(
            `/admin/discount-options/products?q=&brand_id=${encodeURIComponent(
              String(bid),
            )}&load_all=1`,
          );
          const rows = Array.isArray(resp?.data?.serve?.data)
            ? resp.data.serve.data
            : [];
          return { bid, rows };
        }),
      );

      const uniqueById = new Map<number, string>();
      const groupedProductIds: Record<number, number[]> = {};
      const failedBrands: string[] = [];
      const promoStatusFromListing = new Map<
        number,
        { isSale: boolean; isFlashSale: boolean }
      >();

      settled.forEach((result, index) => {
        const bid = normalizedBrandIds[index];
        if (result.status !== "fulfilled") {
          failedBrands.push(String(brandNameMap?.[bid] ?? `#${bid}`));
          return;
        }
        const rows = Array.isArray(result.value.rows) ? result.value.rows : [];
        const idsForBrand: number[] = [];
        rows.forEach((product: any) => {
          const id = toNumber(product?.id ?? 0, 0);
          if (!id) return;
          idsForBrand.push(id);
          const name =
            String(product?.name ?? `Produk ${id}`).trim() || `Produk ${id}`;
          uniqueById.set(id, name);

          const hasSaleField =
            product && ("isSale" in product || "is_sale" in product || "sale" in product);
          const hasFlashField =
            product &&
            ("isFlashSale" in product ||
              "is_flash_sale" in product ||
              "is_flashsale" in product ||
              "flash_sale" in product);

          if (hasSaleField || hasFlashField) {
            promoStatusFromListing.set(id, {
              isSale: parseStatusFlag(
                product?.isSale ?? product?.is_sale ?? product?.sale,
              ),
              isFlashSale: parseStatusFlag(
                product?.isFlashSale ??
                  product?.is_flash_sale ??
                  product?.is_flashsale ??
                  product?.flash_sale,
              ),
            });
          }
        });
        groupedProductIds[bid] = Array.from(new Set(idsForBrand));
      });

      if (failedBrands.length) {
        message.warning(`Gagal memuat sebagian brand: ${failedBrands.join(", ")}`);
      }

      const productIds = Array.from(uniqueById.keys());
      if (!productIds.length) {
        message.warning("Tidak ada produk untuk brand yang dipilih.");
        return;
      }

      const nameMap: Record<number, string> = {};
      uniqueById.forEach((name, id) => {
        nameMap[id] = name;
      });
      if (promoStatusFromListing.size) {
        promoStatusFromListing.forEach((status, productId) => {
          promoStatusCache.current.set(productId, status);
        });
      }
      setBrandProductIdsMap((prev) => ({ ...prev, ...groupedProductIds }));
      await addProductsToVariants(productIds, nameMap);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal memuat produk brand.");
    } finally {
      setProductLoading(false);
    }
  };

  const removeBrandsFromVariants = async (
    brandIds: number[],
    options?: { silent?: boolean },
  ) => {
    const silent = Boolean(options?.silent);
    const normalizedBrandIds = Array.from(
      new Set(brandIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    if (!normalizedBrandIds.length) {
      if (!silent) {
        message.warning("Pilih minimal 1 brand untuk dibatalkan.");
      }
      return;
    }

    setProductLoading(true);
    try {
      const nextMap = { ...brandProductIdsMap };
      const productIdSet = new Set<number>();
      const missingBrandIds = normalizedBrandIds.filter(
        (bid) => !Array.isArray(nextMap[bid]) || nextMap[bid].length === 0,
      );

      if (missingBrandIds.length) {
        const settled = await Promise.allSettled(
          missingBrandIds.map(async (bid) => {
            const resp: any = await http.get(
              `/admin/discount-options/products?q=&brand_id=${encodeURIComponent(
                String(bid),
              )}&load_all=1`,
            );
            const rows = Array.isArray(resp?.data?.serve?.data)
              ? resp.data.serve.data
              : [];
            return { bid, rows };
          }),
        );

        settled.forEach((result, idx) => {
          const bid = missingBrandIds[idx];
          if (result.status !== "fulfilled") return;
          const ids = (Array.isArray(result.value.rows) ? result.value.rows : [])
            .map((row: any) => toNumber(row?.id ?? 0, 0))
            .filter((id: number) => id > 0);
          nextMap[bid] = Array.from(new Set(ids));
        });
      }

      normalizedBrandIds.forEach((bid) => {
        (nextMap[bid] ?? []).forEach((pid) => {
          const id = toNumber(pid, 0);
          if (id > 0) productIdSet.add(id);
        });
      });

      if (!productIdSet.size) {
        if (!silent) {
          message.info("Tidak ada produk dari brand terpilih di daftar.");
        }
        return;
      }

      setBrandProductIdsMap(nextMap);
      setVariants((prev) =>
        prev.filter((row) => !productIdSet.has(toNumber(row.productId, 0))),
      );
      setSelectedVariantIds([]);
      if (!silent) {
        message.success("Brand terpilih berhasil dibatalkan dari daftar.");
      }
    } catch (e: any) {
      if (!silent) {
        message.error(e?.response?.data?.message ?? "Gagal membatalkan brand.");
      }
    } finally {
      setProductLoading(false);
    }
  };

  const searchProductVariants = async (productId: number, keyword: string) => {
    const pid = toNumber(productId ?? 0, 0);
    if (!pid) {
      setVariantOptions([]);
      return;
    }
    const q = String(keyword ?? "").trim();
    const qTokens = splitSearchTokens(q);
    const cached = variantOptionsCache.current.get(pid);
    if (cached) {
      if (!q) {
        setVariantOptions(cached.options);
        return;
      }

      const strictFiltered = cached.options.filter((opt) =>
        isLooseMatch(String(opt.label ?? ""), q),
      );
      const fallbackTokens = qTokens.filter((token) => token.length >= 2);
      const broadFiltered =
        strictFiltered.length > 0
          ? strictFiltered
          : fallbackTokens.length > 0
            ? cached.options.filter((opt) => {
                const label = normalizeSearchText(String(opt.label ?? ""));
                return fallbackTokens.some((token) => label.includes(token));
              })
            : [];

      setVariantOptions(broadFiltered);
      return;
    }

    setVariantLoading(true);
    try {
      const productData = await fetchProductVariants(pid);
      const pname =
        productData?.name ??
        productData?.product_name ??
        productData?.title ??
        `Product ${pid}`;
      const brandName =
        productData?.brand?.name ??
        productData?.brandName ??
        productData?.brand_name ??
        "";

      const rows = Array.isArray(productData?.variants)
        ? productData.variants
        : [];

      const options = rows
        .map((v: any) => {
          const vid = toNumber(
            v?.id ?? v?.product_variant_id ?? v?.variant_id ?? 0,
            0,
          );
          if (!vid) return null;
          const variantLabel = buildVariantLabel(v, vid, {
            allowSkuFallback: false,
          });
          const label = buildFullVariantLabel(
            brandName,
            pname,
            variantLabel,
          );
          return { value: vid, label };
        })
        .filter(Boolean) as { value: number; label: string }[];

      variantOptionsCache.current.set(pid, { options });

      if (!q) {
        setVariantOptions(options);
      } else {
        const strictFiltered = options.filter((opt) =>
          isLooseMatch(String(opt.label ?? ""), q),
        );
        const fallbackTokens = qTokens.filter((token) => token.length >= 2);
        const broadFiltered =
          strictFiltered.length > 0
            ? strictFiltered
            : fallbackTokens.length > 0
              ? options.filter((opt) => {
                  const label = normalizeSearchText(String(opt.label ?? ""));
                  return fallbackTokens.some((token) => label.includes(token));
                })
              : [];

        setVariantOptions(broadFiltered);
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal ambil varian");
    } finally {
      setVariantLoading(false);
    }
  };

  const searchVariantsGlobal = async (keyword: string) => {
    const q = String(keyword ?? "").trim();
    const variantCacheKey = `variant-global:${normalizeSearchText(q)}`;
    const cached = variantGlobalOptionsCacheRef.current.get(variantCacheKey);
    if (cached) {
      setVariantOptions(cached.map((opt) => ({ ...opt })));
      setVariantLoading(false);
      return;
    }
    const qTokens = splitSearchTokens(q);
    const normalizedQuery = normalizeSearchText(q);
    const firstToken = qTokens[0] ?? "";
    const current = ++variantSearchSeq.current;
    if (q) setVariantOptions([]);
    setVariantLoading(true);
    try {
      const pageSize = 200;
      const maxPages = 20;

      const queryApiPage = async (query: string, page = 1) => {
        const resp: any = await http.get(
          `/admin/discount-options/product-variants?q=${encodeURIComponent(
            query,
          )}&page=${page}&per_page=${pageSize}`,
        );
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
      if (
        q &&
        qTokens.length > 1 &&
        list.length < 8 &&
        firstToken &&
        firstToken !== normalizedQuery
      ) {
        const extraList = await queryApi(firstToken);
        if (extraList.length) list = [...list, ...extraList];

        if (list.length < 8) {
          const secondToken = qTokens.find(
            (token, idx) => idx > 0 && token.length >= 3,
          );
          if (secondToken && secondToken !== firstToken) {
            const secondList = await queryApi(secondToken);
            if (secondList.length) list = [...list, ...secondList];
          }
        }
      }

      if (current !== variantSearchSeq.current) return;

      const mapped = list
        .map((v: any) => {
          const variantId = toNumber(v?.product_variant_id ?? v?.id ?? 0, 0);
          const productId = toNumber(v?.product_id ?? 0, 0);
          if (!variantId) return null;
          const brandName = String(
            v?.brand_name ?? v?.brandName ?? v?.brand?.name ?? "",
          ).trim();
          const productName = String(
            v?.product_name ?? v?.productName ?? v?.product?.name ?? "",
          ).trim();
          const variantPart = buildVariantLabel(v, variantId, {
            allowSkuFallback: false,
          });
          const normalizedLabel =
            brandName || productName
              ? buildFullVariantLabel(brandName, productName, variantPart)
              : sanitizeFullVariantLabel(
                  String(v?.label ?? variantPart ?? `Varian ${variantId}`),
                  variantId,
                );
          return {
            value: variantId,
            label: normalizedLabel,
            productId: productId > 0 ? productId : undefined,
          };
        })
        .filter(Boolean) as {
        value: number;
        label: string;
        productId?: number;
      }[];

      const strictFiltered = q
        ? mapped.filter((opt) => isLooseMatch(String(opt.label ?? ""), q))
        : mapped;
      const fallbackTokens = qTokens.filter((token) => token.length >= 2);
      const filtered =
        q && strictFiltered.length === 0 && fallbackTokens.length > 0
          ? mapped.filter((opt) => {
              const label = normalizeSearchText(String(opt.label ?? ""));
              return fallbackTokens.some((token) => label.includes(token));
            })
          : strictFiltered;

      const uniqueByVariantId = new Map<
        number,
        { value: number; label: string; productId?: number }
      >();
      filtered.forEach((opt) => {
        if (!uniqueByVariantId.has(opt.value)) uniqueByVariantId.set(opt.value, opt);
      });

      const resolved = Array.from(uniqueByVariantId.values());
      putCache(
        variantGlobalOptionsCacheRef,
        variantCacheKey,
        resolved.map((opt) => ({ ...opt })),
      );
      setVariantOptions(resolved);
    } catch (e: any) {
      if (current !== variantSearchSeq.current) return;
      setVariantOptions([]);
      message.error(e?.response?.data?.message ?? "Gagal ambil varian");
    } finally {
      if (current === variantSearchSeq.current) setVariantLoading(false);
    }
  };

  const fetchProductVariants = async (productId: number) => {
    const resp: any = await http.get(`/admin/product/${productId}`);
    return resp?.data?.serve;
  };

  const fetchProductsWithVariantsByIds = async (productIds: number[]) => {
    const ids = Array.from(
      new Set(productIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    const grouped = new Map<number, { productData: any; variants: any[] }>();
    if (!ids.length) return grouped;

    const chunkSize = 30;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const resp: any = await http.get(
        `/admin/discount-options/products?ids=${encodeURIComponent(
          chunk.join(","),
        )}&with_variants=1&per_page=${chunk.length}`,
      );
      const list = Array.isArray(resp?.data?.serve?.data)
        ? resp.data.serve.data
        : [];

      list.forEach((product: any) => {
        const pid = toNumber(product?.id ?? product?.product_id ?? 0, 0);
        if (!pid) return;
        const variants = Array.isArray(product?.variants)
          ? product.variants
          : Array.isArray(product?.product_variants)
            ? product.product_variants
            : [];
        grouped.set(pid, { productData: product, variants });
      });
    }

    return grouped;
  };

  const normalizePromoStatus = (raw: any) => {
    return {
      isSale: Boolean(raw?.isSale ?? raw?.is_sale ?? raw?.sale ?? false),
      isFlashSale: Boolean(
        raw?.isFlashSale ??
        raw?.is_flash_sale ??
        raw?.is_flashsale ??
        raw?.flash_sale ??
        false,
      ),
    };
  };

  const fetchPromoStatus = async (productId: number) => {
    if (!productId) return { isSale: false, isFlashSale: false };
    const cached = promoStatusCache.current.get(productId);
    if (cached) return cached;

    try {
      const params: Record<string, number> = {};
      if (editId) params.exclude_flash_sale_id = editId;
      const resp: any = await http.get(
        `/admin/product/${productId}/promo-status`,
        { params },
      );
      const status = normalizePromoStatus(
        resp?.data?.serve ?? resp?.data ?? {},
      );
      promoStatusCache.current.set(productId, status);
      return status;
    } catch {
      return { isSale: false, isFlashSale: false };
    }
  };

  const ensureNoPromoConflicts = async (productIds: number[]) => {
    const uniq = Array.from(
      new Set(productIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    for (const id of uniq) {
      const status = await fetchPromoStatus(id);
      if (status.isSale || status.isFlashSale) {
        return status;
      }
    }
    return null;
  };

  const filterEligibleProducts = async (productIds: number[]) => {
    const uniq = Array.from(
      new Set(productIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    if (!uniq.length) return { allowed: [], blocked: [] };

    const allowed: number[] = [];
    const blocked: number[] = [];

    const statusMap = new Map<number, { isSale: boolean; isFlashSale: boolean }>();
    const missing: number[] = [];
    uniq.forEach((id) => {
      const cached = promoStatusCache.current.get(id);
      if (cached) statusMap.set(id, cached);
      else missing.push(id);
    });

    const chunkSize = 40;
    for (let i = 0; i < missing.length; i += chunkSize) {
      const chunk = missing.slice(i, i + chunkSize);
      const settled = await Promise.allSettled(
        chunk.map((id) => fetchPromoStatus(id)),
      );
      settled.forEach((result, idx) => {
        const id = chunk[idx];
        if (!id) return;
        const status =
          result.status === "fulfilled"
            ? result.value
            : { isSale: false, isFlashSale: false };
        statusMap.set(id, status);
      });
    }

    uniq.forEach((id) => {
      const status = statusMap.get(id) ?? { isSale: false, isFlashSale: false };
      if (status.isFlashSale || status.isSale) blocked.push(id);
      else allowed.push(id);
    });

    return { allowed, blocked };
  };

  const resolveVariantId = (variant: any) =>
    toNumber(
      variant?.id ?? variant?.product_variant_id ?? variant?.variant_id ?? 0,
      0,
    );

  const addProductsToVariants = async (
    productIds: number[],
    nameMap?: Record<number, string>,
  ) => {
    const ids = Array.from(
      new Set(productIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    if (!ids.length) return;

    setLoading(true);
    try {
      const { allowed, blocked } = await filterEligibleProducts(ids);
      if (!allowed.length) {
        message.error("product sedang dalam keadaan sale/flash sale");
        return;
      }

      if (blocked.length) {
        message.warning(
          `${blocked.length} produk sedang sale/flash sale dan tidak ikut ditambahkan.`,
        );
      }

      const rowsList: Array<{ productId: number; data: any }> = [];
      const failedIds: number[] = [];
      const unresolved = new Set<number>(allowed);

      try {
        const batched = await fetchProductsWithVariantsByIds(allowed);
        batched.forEach((payload, pid) => {
          rowsList.push({
            productId: pid,
            data: { ...payload.productData, variants: payload.variants },
          });
          unresolved.delete(pid);
        });
      } catch {
        // Fallback ke request per produk jika endpoint batch gagal.
      }

      const remainingIds = Array.from(unresolved);
      const chunkSize = 12;
      for (let i = 0; i < remainingIds.length; i += chunkSize) {
        const slice = remainingIds.slice(i, i + chunkSize);
        const responses = await Promise.allSettled(
          slice.map(async (pid) => ({
            productId: pid,
            data: await fetchProductVariants(pid),
          })),
        );

        responses.forEach((res, idx) => {
          const pid = slice[idx];
          if (res.status === "fulfilled" && res.value?.data) {
            rowsList.push({
              productId: res.value.productId,
              data: res.value.data,
            });
          } else if (pid) {
            failedIds.push(pid);
          }
        });
      }

      if (!rowsList.length) {
        message.error("Gagal mengambil data produk");
        return;
      }

      setVariants((prev) => {
        const map = new Map<number, VariantRow>();
        for (const r of prev) map.set(r.variantId, r);

        for (const entry of rowsList) {
          const pid = entry.productId;
          const productData = entry.data;
          const rows = Array.isArray(productData?.variants)
            ? productData.variants
            : [];
          const pnameRaw =
            nameMap?.[pid] || productData?.name || `Product ${pid}`;
          const brandName =
            productData?.brand?.name ??
            productData?.brandName ??
            productData?.brand_name ??
            "";
          const pname = buildBaseProductLabel(brandName, pnameRaw);
          for (const v of rows) {
            const pvId = resolveVariantId(v);
            if (!pvId) continue;
            if (map.has(pvId)) continue;

            const basePrice = toNumber(v?.price ?? 0, 0);
            const baseStock = resolveVariantStock(v);
            const variantLabel = buildVariantLabel(v, pvId, {
              allowSkuFallback: false,
            });
            const fullLabel = buildFullVariantLabel(
              brandName,
              pnameRaw,
              variantLabel,
            );

            map.set(pvId, {
              variantId: pvId,
              productId: toNumber(productData?.id ?? pid, pid),
              productName: pname,
              sku: v?.sku ?? null,
              image: resolveVariantImage(v, productData),
              label: fullLabel,
              basePrice,
              baseStock,
              flashPrice: basePrice,
              flashPercent: 0,
              flashStock: baseStock,
              isActive: true,
            });
          }
        }

        return Array.from(map.values());
      });

      if (failedIds.length) {
        message.warning(
          `${failedIds.length} produk gagal diambil dan tidak ditambahkan.`,
        );
      }
      message.success("Produk berhasil ditambahkan");
    } catch {
      message.error("Gagal mengambil data produk");
    } finally {
      setLoading(false);
    }
  };

  const addVariantsToFlashSale = async (
    productId: number,
    variantIds: number[],
    options?: { silentSuccess?: boolean; silentError?: boolean },
  ) => {
    const pid = toNumber(productId ?? 0, 0);
    if (!pid || !variantIds.length) return false;

    setLoading(true);
    try {
      const status = await fetchPromoStatus(pid);
      if (status.isFlashSale) {
        if (!options?.silentError) {
          message.error("product sedang dalam keadaan flash sale");
        }
        return false;
      }
      if (status.isSale) {
        if (!options?.silentError) {
          message.error("product tersebut sedang dalam keadaan sale");
        }
        return false;
      }

      const productData = await fetchProductVariants(pid);
      const rows = Array.isArray(productData?.variants)
        ? productData.variants
        : [];
      const selected = new Set(
        variantIds.map((id) => Number(id)).filter((id) => id > 0),
      );
      const pnameRaw = productData?.name || `Product ${pid}`;
      const brandName =
        productData?.brand?.name ??
        productData?.brandName ??
        productData?.brand_name ??
        "";
      const pname = buildBaseProductLabel(brandName, pnameRaw);

      setVariants((prev) => {
        const map = new Map<number, VariantRow>();
        for (const r of prev) map.set(r.variantId, r);

        for (const v of rows) {
          const pvId = resolveVariantId(v);
          if (!pvId || !selected.has(pvId)) continue;
          if (map.has(pvId)) continue;

          const basePrice = toNumber(v?.price ?? 0, 0);
          const baseStock = resolveVariantStock(v);
          const variantLabel = buildVariantLabel(v, pvId, {
            allowSkuFallback: false,
          });
          const fullLabel = buildFullVariantLabel(
            brandName,
            pnameRaw,
            variantLabel,
          );

          map.set(pvId, {
            variantId: pvId,
            productId: toNumber(productData?.id ?? pid, pid),
            productName: pname,
            sku: v?.sku ?? null,
            image: resolveVariantImage(v, productData),
            label: fullLabel,
            basePrice,
            baseStock,
            flashPrice: basePrice,
            flashPercent: 0,
            flashStock: baseStock,
            isActive: true,
          });
        }

        return Array.from(map.values());
      });

      if (!options?.silentSuccess) {
        message.success("Varian berhasil ditambahkan");
      }
      return true;
    } catch {
      if (!options?.silentError) {
        message.error("Gagal mengambil data produk");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addVariantIdsToFlashSale = async (variantIds: number[]) => {
    const ids = Array.from(
      new Set(variantIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    if (!ids.length) return;

    try {
      const resp: any = await http.get(
        `/admin/discount-options/product-variants?variant_ids=${encodeURIComponent(
          ids.join(","),
        )}`,
      );
      const list = resp?.data?.serve?.data ?? [];

      const byProduct = new Map<number, number[]>();
      for (const row of list) {
        const pid = toNumber(row?.product_id ?? 0, 0);
        const vid = toNumber(row?.product_variant_id ?? row?.id ?? 0, 0);
        if (!pid || !vid) continue;
        const prev = byProduct.get(pid) ?? [];
        prev.push(vid);
        byProduct.set(pid, prev);
      }

      if (!byProduct.size) {
        message.error("Data varian tidak valid");
        return;
      }

      let successGroups = 0;
      for (const [pid, vids] of byProduct.entries()) {
        const ok = await addVariantsToFlashSale(pid, vids, {
          silentSuccess: true,
          silentError: true,
        });
        if (ok) successGroups += 1;
      }

      if (successGroups > 0) {
        message.success("Varian berhasil ditambahkan");
      } else {
        message.error("Varian tidak bisa ditambahkan");
      }

      const resolvedVariantIds = new Set<number>();
      list.forEach((row: any) => {
        const vid = toNumber(row?.product_variant_id ?? row?.id ?? 0, 0);
        if (vid) resolvedVariantIds.add(vid);
      });
      const unresolvedCount = ids.filter((id) => !resolvedVariantIds.has(id)).length;
      if (unresolvedCount > 0) {
        message.warning(
          `${unresolvedCount} varian tidak ditemukan dan tidak ikut ditambahkan.`,
        );
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal menambahkan varian");
    }
  };

  const addProductToVariants = async (
    productId: number,
    productName: string,
  ) => {
    setLoading(true);
    try {
      const promoStatus = await fetchPromoStatus(productId);
      if (promoStatus.isFlashSale) {
        message.error("product sedang dalam keadaan flash sale");
        return;
      }
      if (promoStatus.isSale) {
        message.error("product tersebut sedang dalam keadaan sale");
        return;
      }

      const productData = await fetchProductVariants(productId);
      const rows = Array.isArray(productData?.variants)
        ? productData.variants
        : [];
      const resolvedProductId = toNumber(productData?.id, productId);
      const pnameRaw = productName || productData?.name || `Product ${productId}`;
      const brandName =
        productData?.brand?.name ??
        productData?.brandName ??
        productData?.brand_name ??
        "";
      const pname = buildBaseProductLabel(brandName, pnameRaw);

      setVariants((prev) => {
        const map = new Map<number, VariantRow>();
        for (const r of prev) map.set(r.variantId, r);

        for (const v of rows) {
          const pvId = resolveVariantId(v);
          if (!pvId) continue;
          if (map.has(pvId)) continue;

          const basePrice = toNumber(v.price ?? 0);
          const baseStock = resolveVariantStock(v);
          const variantLabel = buildVariantLabel(v, pvId, {
            allowSkuFallback: false,
          });
          const fullLabel = buildFullVariantLabel(
            brandName,
            pnameRaw,
            variantLabel,
          );

          map.set(pvId, {
            variantId: pvId,
            productId: resolvedProductId,
            productName: pname,
            sku: v.sku ?? null,
            image: resolveVariantImage(v, productData),
            label: fullLabel,
            basePrice,
            baseStock,
            flashPrice: basePrice,
            flashPercent: 0,
            flashStock: baseStock,
            isActive: true,
          });
        }

        return Array.from(map.values());
      });

      message.success("Produk ditambahkan");
      setSelectedProductId(null);
      setSelectedProductName("");
    } catch {
      message.error("Gagal mengambil data produk");
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (productId: number) => {
    const idsToRemove = new Set(
      variants.filter((v) => v.productId === productId).map((v) => v.variantId),
    );
    const existingIds = new Set(variants.map((v) => v.variantId));
    setVariants((prev) => prev.filter((v) => v.productId !== productId));
    setSelectedVariantIds((prev) =>
      prev.filter((id) => existingIds.has(id) && !idsToRemove.has(id)),
    );
  };

  const removeVariant = (variantId: number) => {
    const vid = toNumber(variantId ?? 0, 0);
    if (!vid) return;
    setVariants((prev) => prev.filter((v) => v.variantId !== vid));
    setSelectedVariantIds((prev) => prev.filter((id) => id !== vid));
  };

  const updateVariant = (variantId: number, patch: Partial<VariantRow>) => {
    setVariants((prev) =>
      prev.map((r) => (r.variantId === variantId ? { ...r, ...patch } : r)),
    );
  };

  // --- Bulk Logic ---
  const applyBulk = (scope: "selected" | "all") => {
    const target =
      scope === "all"
        ? new Set(variants.map((v) => v.variantId))
        : new Set(selectedVariantIds);

    setVariants((prev) =>
      prev.map((r) => {
        if (!target.has(r.variantId)) return r;
        const next: VariantRow = { ...r };

        if (bulkPercent !== null) {
          const { pct, discounted } = computeFromPercent(
            r.basePrice,
            bulkPercent,
          );
          next.flashPercent = pct;
          next.flashPrice = discounted;
        }

        if (bulkPrice !== null) {
          const { p, pct } = computeFromPrice(r.basePrice, bulkPrice);
          next.flashPrice = p;
          next.flashPercent = pct;
        }

        if (bulkStock !== null) {
          next.flashStock = clamp(bulkStock, 0, r.baseStock);
        }

        return next;
      }),
    );
    message.success("Perubahan diterapkan");
  };

  const deleteSelectedVariants = () => {
    if (!selectedVariantIds.length) return;
    const set = new Set(selectedVariantIds);
    setVariants((prev) => prev.filter((v) => !set.has(v.variantId)));
    setSelectedVariantIds([]);
    message.success("Varian dihapus");
  };

  // --- Grouping for Table ---
  const productGroups = useMemo(() => {
    const map = new Map<number, VariantRow[]>();
    for (const v of variants) {
      if (!map.has(v.productId)) map.set(v.productId, []);
      map.get(v.productId)!.push(v);
    }

    const groups: {
      key: string;
      productId: number;
      productName: string;
      image?: string | null;
      totalVariants: number;
      variants: VariantRow[];
    }[] = [];
    for (const [pid, list] of map.entries()) {
      const image = list.find((v) => v.image)?.image ?? null;
      groups.push({
        key: `p-${pid}`,
        productId: pid,
        productName: list[0]?.productName || `Product ${pid}`,
        image,
        totalVariants: list.length,
        variants: list,
      });
    }
    return groups;
  }, [variants]);

  const summary = useMemo(() => {
    const totalVariants = variants.length;
    const activeVariants = variants.filter((v) => v.isActive).length;
    const productIds = new Set(variants.map((v) => v.productId));
    const totalProducts = productIds.size;
    const totalQuota = variants.reduce((sum, v) => sum + v.flashStock, 0);
    return { totalProducts, totalVariants, activeVariants, totalQuota };
  }, [variants]);

  // --- Submit ---
  const onFinish = async (values: FormValues) => {
    if (!variants.length) {
      message.error("Pilih minimal 1 produk");
      return;
    }

    let normalized = false;
    const normalizedVariants = variants.map((v) => {
      const shouldDeactivate = v.flashStock <= 0 || v.flashPrice <= 0;
      if (!shouldDeactivate) return v;

      const alreadyInactive =
        !v.isActive &&
        v.flashPrice === v.basePrice &&
        (v.flashPercent ?? 0) === 0 &&
        v.flashStock === 0;
      if (alreadyInactive) return v;

      normalized = true;
      return {
        ...v,
        isActive: false,
        flashPrice: v.basePrice,
        flashPercent: 0,
        flashStock: 0,
      };
    });

    if (normalized) setVariants(normalizedVariants);

    const activeVariants = normalizedVariants.filter((v) => v.isActive);
    if (!activeVariants.length) {
      message.error("Tidak ada varian yang aktif");
      return;
    }

    const productIds = Array.from(
      new Set(
        normalizedVariants
          .map((v) => Number(v.productId))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );
    const promoConflict = await ensureNoPromoConflicts(productIds);
    if (promoConflict) {
      message.error("product dalam keadaan sale/flash sale");
      return;
    }

    const payloadVariants: FlashSaleVariantInput[] = normalizedVariants.map(
      (v) => ({
        variant_id: v.variantId,
        flash_price: v.flashPrice,
        stock: v.flashStock,
      }),
    );

    const payload = {
      title: values.title || null,
      description: values.description || null,
      has_button: !!values.has_button,
      button_text: values.has_button ? values.button_text || null : null,
      button_url: values.has_button ? values.button_url || null : null,
      start_datetime: values.start_datetime.format(DATE_FMT),
      end_datetime: values.end_datetime.format(DATE_FMT),
      is_publish: !!values.is_publish,
      variants: payloadVariants,
    };

    const submitPayload = async () => {
      setLoading(true);
      try {
        if (editId) {
          await updateFlashSale(editId, payload, {
            exclude_flash_sale_id: editId,
          });
          message.success("Flash Sale berhasil diupdate");
        } else {
          await createFlashSale(payload);
          message.success("Flash Sale berhasil dibuat");
        }
        handleClose();
      } catch (e: any) {
        const status = e?.response?.status;
        const respData = e?.response?.data;
        const rawMessage = respData?.message ?? e?.message ?? "";
        if (status === 409 && respData?.serve?.code === "DISCOUNT_CONFLICT") {
          const conflictProductIds = Array.isArray(respData?.serve?.productIds)
            ? respData.serve.productIds
                .map((id: any) => Number(id))
                .filter((id: number) => Number.isFinite(id) && id > 0)
            : [];
          const conflictDiscountIds = Array.isArray(respData?.serve?.discountIds)
            ? respData.serve.discountIds
                .map((id: any) => Number(id))
                .filter((id: number) => Number.isFinite(id) && id > 0)
            : [];

          if (conflictProductIds.length > 0) {
            const conflictSet = new Set(conflictProductIds);
            const nextVariants = normalizedVariants.filter(
              (v) => !conflictSet.has(Number(v.productId)),
            );
            const removedCount = normalizedVariants.length - nextVariants.length;
            if (removedCount > 0) {
              setVariants(nextVariants);

              const productNames = Array.from(
                new Set(
                  normalizedVariants
                    .filter((v) => conflictSet.has(Number(v.productId)))
                    .map((v) => String(v.productName || `Product ${v.productId}`)),
                ),
              );
              const shownNames = productNames.slice(0, 4).join(", ");
              const moreNames =
                productNames.length > 4
                  ? ` +${productNames.length - 4} produk lainnya`
                  : "";
              const discountInfo = conflictDiscountIds.length
                ? ` (discount ID: ${conflictDiscountIds.join(", ")})`
                : "";

              if (nextVariants.length > 0) {
                message.warning(
                  `${removedCount} varian konflik diskon sudah dihapus dari draft${discountInfo}. Produk konflik: ${shownNames}${moreNames}. Klik Simpan lagi.`,
                );
              } else {
                message.error(
                  `Semua varian bentrok dengan discount aktif${discountInfo}. Hapus produk konflik dulu atau ubah periode flash sale.`,
                );
              }
              return;
            }
          }

          const discountInfo = conflictDiscountIds.length
            ? ` (discount ID: ${conflictDiscountIds.join(", ")})`
            : "";
          message.error(
            `Produk sedang ada dalam discount pada periode tersebut${discountInfo}.`,
          );
          return;
        }
        if (status === 409) {
          const conflicts = parsePromoConflictLines(rawMessage);
          if (conflicts.length > 0) {
            const max = 6;
            const visible = conflicts.slice(0, max);
            const remaining = conflicts.length - visible.length;
            const description = `${visible.join("\n")}${
              remaining > 0 ? `\n... dan ${remaining} varian lainnya` : ""
            }`;

            notification.error({
              message: "Varian sudah aktif di promo lain",
              description: React.createElement(
                "div",
                { style: { whiteSpace: "pre-line" } },
                description,
              ),
              duration: 6,
            });
            return;
          }
        }

        message.error(rawMessage || "Gagal menyimpan Flash Sale");
      } finally {
        setLoading(false);
      }
    };

    await submitPayload();
  };

  return {
    loading,
    hasButton,
    productOptions,
    productLoading,
    selectedProductId,
    setSelectedProductId,
    selectedProductName,
    setSelectedProductName,
    variants,
    selectedVariantIds,
    setSelectedVariantIds,
    bulkPercent,
    setBulkPercent,
    bulkPrice,
    setBulkPrice,
    bulkStock,
    setBulkStock,
    searchProducts,
    addProductToVariants,
    removeProduct,
    removeVariant,
    updateVariant,
    applyBulk,
    deleteSelectedVariants,
    productGroups,
    summary,
    onFinish,
    computeFromPercent,
    computeFromPrice,
    clamp,
    toNumber,
    inputMode,
    setInputMode: (mode: "product" | "brand" | "variant") => {
      setInputMode(mode);
      setSelectedProductId(null);
      setSelectedProductName("");
      setSelectedBrandIds([]);
      setSelectedBrandNameMap({});
      setVariantOptions([]);
      setSelectedVariantIdsToAdd([]);
    },
    brandOptions,
    brandProductOptions,
    brandLoading,
    selectedBrandIds,
    selectedBrandNameMap,
    variantOptions,
    variantLoading,
    selectedVariantIdsToAdd,
    setSelectedBrandIds,
    setSelectedBrandNameMap,
    setSelectedVariantIdsToAdd,
    searchBrands,
    loadMoreBrands,
    searchBrandProducts,
    addBrandsToVariants,
    removeBrandsFromVariants,
    searchProductVariants,
    searchVariantsGlobal,
    addProductsToVariants,
    addVariantsToFlashSale,
    addVariantIdsToFlashSale,
  };
};

export { useFormFlashSale };




