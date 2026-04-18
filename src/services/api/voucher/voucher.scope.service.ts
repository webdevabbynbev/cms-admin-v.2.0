import { normalizePositiveNumberIds } from "../../../utils/voucher/number";

export type VoucherScopeOption = {
  value: number;
  label: string;
};

export type VoucherScopeSearchCandidate = VoucherScopeOption & {
  searchText: string;
};

export type VoucherPreviewRow = {
  key: string;
  scopeType: number;
  sourceScopeType: number;
  sourceScopeId: number;
  id: number;
  name: string;
  price: number;
  stock?: number;
};

export const normalizeScopeIds = (raw: unknown): number[] =>
  normalizePositiveNumberIds(raw);

const cleanPart = (value: unknown) => String(value ?? "").trim();

const isSkuLike = (value: string) => {
  const v = String(value ?? "")
    .trim()
    .replace(/^SKU\s*:?\s*/i, "");
  if (!v) return false;
  if (/^[A-Z0-9]+(?:-[A-Z0-9]+){1,}$/i.test(v)) return true;
  if (/^\d{8,}$/.test(v)) return true;
  return false;
};

export const buildBaseProductLabel = (brandName: string, productName: string) => {
  const brand = cleanPart(brandName);
  const product = cleanPart(productName);
  if (!brand) return product || "Produk";
  if (product.toLowerCase().startsWith(`${brand.toLowerCase()} -`))
    return product;
  return `${brand} - ${product || "Produk"}`;
};

const sanitizeFullVariantLabel = (value: string, fallbackVariantId = 0) => {
  const raw = String(value ?? "")
    .replace(/\s*SKU\s*:.*$/i, "")
    .trim();
  if (!raw)
    return fallbackVariantId > 0 ? `VAR-${fallbackVariantId}` : "Varian";

  const parts = raw
    .split(" - ")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^Varian\s*:\s*/i, "").trim())
    .filter((p) => p && !isSkuLike(p));

  if (!parts.length)
    return fallbackVariantId > 0 ? `VAR-${fallbackVariantId}` : "Varian";
  return parts.join(" - ");
};

export const resolveVariantPart = (variant: any, fallbackVariantId: number) => {
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

export const composeVariantLabel = (
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

export const normalizeSearchText = (value: string) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const compactSearchText = (value: string) =>
  normalizeSearchText(value).replace(/\s+/g, "");

export const splitSearchTokens = (value: string) =>
  normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

export const isLooseMatch = (label: string, query: string) => {
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

export const dedupeScopeOptions = (options: VoucherScopeOption[]) => {
  const uniqueById = new Map<number, VoucherScopeOption>();
  options.forEach((option) => {
    if (!uniqueById.has(option.value)) {
      uniqueById.set(option.value, option);
    }
  });
  return Array.from(uniqueById.values());
};

export const mapBrandScopeOptions = (
  list: Array<Record<string, unknown>>,
): VoucherScopeOption[] =>
  dedupeScopeOptions(
    list.map((brand) => ({
      value: Number(brand?.id ?? 0),
      label: String(brand?.name ?? `Brand #${brand?.id}`),
    })),
  ).filter((option) => option.value > 0);

export const mapProductScopeCandidates = (
  list: any[],
): VoucherScopeSearchCandidate[] =>
  list
    .map((product) => {
      const id = Number(product?.id ?? 0);
      if (!id) return null;
      const brandName = String(
        product?.brand_name ?? product?.brandName ?? product?.brand?.name ?? "",
      );
      const productName = String(product?.name ?? `Product #${id}`);
      const label = buildBaseProductLabel(brandName, productName);
      const searchText = [
        label,
        `${brandName.trim()} ${String(product?.name ?? "").trim()}`.trim(),
        `${String(product?.name ?? "").trim()} ${brandName.trim()}`.trim(),
      ]
        .filter(Boolean)
        .join(" | ");
      return { value: id, label, searchText };
    })
    .filter(Boolean) as VoucherScopeSearchCandidate[];

export const mapVariantScopeCandidates = (
  list: Array<Record<string, unknown>>,
): VoucherScopeSearchCandidate[] =>
  list
    .map((variant) => {
      const variantId = Number(variant?.product_variant_id ?? variant?.id ?? 0);
      if (!variantId) return null;
      const label = composeVariantLabel(variant, variantId);
      return { value: variantId, label, searchText: label };
    })
    .filter(Boolean) as VoucherScopeSearchCandidate[];

export const filterScopeCandidates = (
  candidates: VoucherScopeSearchCandidate[],
  query: string,
): VoucherScopeOption[] => {
  const q = String(query ?? "").trim();
  if (!q) {
    return dedupeScopeOptions(
      candidates.map((candidate) => ({
        value: candidate.value,
        label: candidate.label,
      })),
    );
  }

  const strictFiltered = candidates.filter((candidate) =>
    isLooseMatch(candidate.searchText, q),
  );
  const tokens = splitSearchTokens(q).filter((token) => token.length >= 2);
  const filteredCandidates =
    strictFiltered.length === 0 && tokens.length > 0
      ? candidates.filter((candidate) => {
          const searchable = normalizeSearchText(candidate.searchText);
          return tokens.some((token) => searchable.includes(token));
        })
      : strictFiltered;

  return dedupeScopeOptions(
    filteredCandidates.map((candidate) => ({
      value: candidate.value,
      label: candidate.label,
    })),
  );
};

export const mapProductPreviewRows = (
  products: Array<Record<string, unknown>>,
  scopeProduct: number,
): VoucherPreviewRow[] => {
  const rows: VoucherPreviewRow[] = [];
  products.forEach((product) => {
    const productId = Number(product?.id ?? 0);
    if (!productId) return;
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const productName = String(
      product?.name ?? product?.product_name ?? `Product #${productId}`,
    );

    if (!variants.length) {
      rows.push({
        key: `product-${productId}`,
        scopeType: scopeProduct,
        sourceScopeType: scopeProduct,
        sourceScopeId: productId,
        id: productId,
        name: productName,
        price: Number(product?.price ?? 0),
        stock: Number(product?.stock ?? product?.quantity ?? 0),
      });
      return;
    }

    variants.forEach((variant) => {
      const variantObj = (variant ?? {}) as Record<string, unknown>;
      const variantId = Number(
        variantObj?.id ?? variantObj?.product_variant_id ?? variantObj?.variant_id ?? 0,
      );
      const variantPart = resolveVariantPart(variantObj, variantId);
      rows.push({
        key: `product-${productId}-variant-${variantId || variantPart}`,
        scopeType: scopeProduct,
        sourceScopeType: scopeProduct,
        sourceScopeId: productId,
        id: variantId || productId,
        name: `${productName} - ${variantPart}`,
        price: Number(variantObj?.price ?? 0),
        stock: Number(
          variantObj?.stock ??
            variantObj?.quantity ??
            product?.stock ??
            product?.quantity ??
            0,
        ),
      });
    });
  });
  return rows;
};

export const mapBrandPreviewRows = (
  brandId: number,
  products: Array<Record<string, unknown>>,
  scopeBrand: number,
): VoucherPreviewRow[] => {
  const rows: VoucherPreviewRow[] = [];
  products.forEach((product) => {
    const productId = Number(product?.id ?? 0);
    if (!productId) return;
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const productName = String(
      product?.name ?? product?.product_name ?? `Product #${productId}`,
    );

    if (!variants.length) {
      rows.push({
        key: `brand-${brandId}-product-${productId}`,
        scopeType: scopeBrand,
        sourceScopeType: scopeBrand,
        sourceScopeId: Number(brandId),
        id: productId,
        name: productName,
        price: Number(product?.price ?? 0),
        stock: Number(product?.stock ?? product?.quantity ?? 0),
      });
      return;
    }

    variants.forEach((variant) => {
      const variantObj = (variant ?? {}) as Record<string, unknown>;
      const variantId = Number(
        variantObj?.id ?? variantObj?.product_variant_id ?? variantObj?.variant_id ?? 0,
      );
      const variantPart = resolveVariantPart(variantObj, variantId);
      rows.push({
        key: `brand-${brandId}-product-${productId}-variant-${variantId || variantPart}`,
        scopeType: scopeBrand,
        sourceScopeType: scopeBrand,
        sourceScopeId: Number(brandId),
        id: variantId || productId,
        name: `${productName} - ${variantPart}`,
        price: Number(variantObj?.price ?? 0),
        stock: Number(
          variantObj?.stock ??
            variantObj?.quantity ??
            product?.stock ??
            product?.quantity ??
            0,
        ),
      });
    });
  });
  return rows;
};

export const mapVariantPreviewRows = (
  variants: Array<Record<string, unknown>>,
  scopeVariant: number,
): VoucherPreviewRow[] =>
  variants
    .map((variant) => {
      const variantId = Number(variant?.product_variant_id ?? 0);
      if (!variantId) return null;
      return {
        key: `variant-${variantId}`,
        scopeType: scopeVariant,
        sourceScopeType: scopeVariant,
        sourceScopeId: variantId,
        id: variantId,
        name: composeVariantLabel(variant, variantId),
        price: Number(variant?.price ?? 0),
        stock: Number(variant?.stock ?? variant?.quantity ?? 0),
      };
    })
    .filter(Boolean) as VoucherPreviewRow[];

export const mergePreviewRows = (
  currentRows: VoucherPreviewRow[],
  incomingRows: VoucherPreviewRow[],
) => {
  const merged = new Map(currentRows.map((row) => [row.key, row]));
  incomingRows.forEach((row) => merged.set(row.key, row));
  return Array.from(merged.values());
};

export const removePreviewRowsByScopeSelection = (
  previewRows: VoucherPreviewRow[],
  targetScopeType: number,
  removedScopeIds: number[],
) => {
  const idSet = new Set(normalizeScopeIds(removedScopeIds));
  if (!idSet.size) return previewRows;
  return previewRows.filter(
    (row) =>
      !(
        Number(row.sourceScopeType) === Number(targetScopeType) &&
        idSet.has(Number(row.sourceScopeId))
      ),
  );
};
