import type React from "react";
import type { VariantRow } from "./discountFormTypes";
import { clamp, prettyVariantName } from "./discountFormUtils";
import {
  computeFromPercent,
  computeFromPrice,
} from "./discountFormPageHelpers";
import type { ProductMeta } from "./discountFormProductHandlers";

type HydrationDeps = {
  productMetaById: Record<number, ProductMeta>;
  productNameById: Record<number, string>;
  setProductMetaById: React.Dispatch<
    React.SetStateAction<Record<number, ProductMeta>>
  >;
  setProductNameById: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  setVariants: React.Dispatch<React.SetStateAction<VariantRow[]>>;
  fetchProductsMetaByIds: (
    productIds: number[],
  ) => Promise<Record<number, ProductMeta>>;
  fetchProductVariantsByIds: (
    variantIds: number[],
  ) => Promise<
    Record<
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
    >
  >;
};

export const createDiscountHydrationHandlers = (deps: HydrationDeps) => {
  const {
    setProductMetaById,
    setProductNameById,
    setVariants,
    fetchProductsMetaByIds,
    fetchProductVariantsByIds,
  } = deps;

  const hydrateFromVariantItems = async (serve: any) => {
    
    const rawItems = Array.isArray(serve?.variantItems)
      ? serve.variantItems
      : [];
    
    

    if (!rawItems.length) {
      
      setVariants([]);
      return;
    }

    const out: VariantRow[] = [];
    const productIds = new Set<number>();
    const nameMap: Record<number, string> = {};

    const resolveProductId = (item: any) =>
      Number(
        item?.productId ??
          item?.product_id ??
          item?.product?.id ??
          item?.product?.productId ??
          item?.variant?.product_id ??
          item?.variant?.product?.id ??
          item?.variant?.product?.ids ??
          0,
      ) || 0;

    const resolveProductName = (item: any, productId: number) => {
      const rawName =
        item?.productName ??
        item?.product_name ??
        item?.product?.name ??
        item?.variant?.product?.name ??
        "";
      const name = String(rawName ?? "").trim();
      return name || `Produk ${productId || "-"}`;
    };

    const resolveVariantLabel = (item: any, pvId: number) => {
      const raw =
        item?.variantLabel ??
        item?.variant_label ??
        item?.label ??
        item?.variant?.label ??
        item?.sku ??
        item?.variant?.sku ??
        "";
      const cleaned = String(raw ?? "").trim();
      return cleaned || `VAR-${pvId}`;
    };

    const resolveImage = (item: any) =>
      item?.image ??
      item?.productImage ??
      item?.product_image ??
      item?.product?.image ??
      item?.variant?.product?.image ??
      null;

    for (const it of rawItems) {
      const pvId = Number(it?.product_variant_id ?? it?.productVariantId ?? 0);
      if (!pvId) continue;

      const productId = resolveProductId(it);
      if (productId > 0) productIds.add(productId);

      const productName = resolveProductName(it, productId);
      if (productId > 0 && productName) {
        nameMap[productId] = productName;
      }

      const label = resolveVariantLabel(it, pvId);
      const sku = it?.sku ?? it?.variant?.sku ?? null;
      const basePrice = Number(it?.price ?? it?.variant?.price ?? 0);
      const stock = Number(it?.stock ?? it?.variant?.stock ?? 0);
      const initialImage = resolveImage(it);

      const isActive =
        typeof it?.is_active === "number"
          ? Number(it.is_active) === 1
          : typeof it?.isActive === "boolean"
            ? it.isActive
            : true;

      const promoStockRaw = it?.promo_stock ?? it?.promoStock;
      const purchaseLimitRaw = it?.purchase_limit ?? it?.purchaseLimit;
      const maxDiscountRaw = it?.max_discount ?? it?.maxDiscount;

      const valueType = String(
        it?.value_type ?? it?.valueType ?? "percent",
      ).toLowerCase();
      const valueNum = Number(it?.value ?? 0);

      let discountPrice: number | null = null;
      let discountPercent: number | null = null;
      let lastEdited: "price" | "percent" | null = null;

      if (valueType === "fixed") {
        const finalPrice = clamp(
          Math.round(basePrice - valueNum),
          0,
          basePrice,
        );
        const { pct } = computeFromPrice(basePrice, finalPrice);
        discountPrice = finalPrice;
        discountPercent = pct;
        lastEdited = "price";
      } else {
        const { pct, discounted } = computeFromPercent(basePrice, valueNum);
        discountPercent = pct;
        discountPrice = discounted;
        lastEdited = "percent";
      }

      out.push({
        productVariantId: pvId,
        productId,
        brandId: null,
        brandName: null,
        productName,
        sku,

        label,
        variantName: prettyVariantName(label),

        basePrice,
        stock,

        isActive,

        discountPrice,
        discountPercent,
        lastEdited,

        promoStock:
          promoStockRaw === null || promoStockRaw === undefined
            ? null
            : Number(promoStockRaw),
        purchaseLimit:
          purchaseLimitRaw === null || purchaseLimitRaw === undefined
            ? null
            : Number(purchaseLimitRaw),

        maxDiscount:
          maxDiscountRaw === null || maxDiscountRaw === undefined
            ? null
            : Number(maxDiscountRaw),
        image: initialImage,
      });
    }

    const sortedInitial = out.sort((a, b) => {
      if (a.productId !== b.productId) return a.productId - b.productId;
      return a.productVariantId - b.productVariantId;
    });

    setProductNameById((prev) => ({ ...prev, ...nameMap }));
    setVariants(sortedInitial);

    const variantIds = sortedInitial
      .map((row) => Number(row.productVariantId))
      .filter((id) => id > 0);

    const pidList = Array.from(productIds.values());
    if (!pidList.length) {
      setVariants([]);
      return;
    }

    const chunkSize = 120;
    void (async () => {
      for (let i = 0; i < pidList.length; i += chunkSize) {
        const chunk = pidList.slice(i, i + chunkSize);
        try {
          const metaChunk = await fetchProductsMetaByIds(chunk);
          setProductMetaById((prev) => ({ ...prev, ...metaChunk }));

          setVariants((prev) =>
            prev.map((row) => {
              const meta = metaChunk[row.productId];
              if (!meta) return row;
              return {
                ...row,
                brandId: meta.brandId ?? row.brandId,
                brandName: meta.brandName ?? row.brandName,
                image: meta.image ?? row.image,
              };
            }),
          );
        } catch {
          // ignore meta errors
        }
      }
    })();

    const variantChunkSize = 200;
    void (async () => {
      for (let i = 0; i < variantIds.length; i += variantChunkSize) {
        const chunk = variantIds.slice(i, i + variantChunkSize);
        try {
          const variantChunk = await fetchProductVariantsByIds(chunk);
          setVariants((prev) =>
            prev.map((row) => {
              const v = variantChunk[row.productVariantId];
              if (!v) return row;
              const nextLabel = String(v.label ?? row.label ?? "");
              return {
                ...row,
                productId: v.product_id || row.productId,
                sku: v.sku ?? row.sku,
                label: nextLabel || row.label,
                variantName: prettyVariantName(nextLabel || row.label),
                basePrice:
                  typeof v.price === "number" && Number.isFinite(v.price)
                    ? v.price
                    : row.basePrice,
                stock:
                  typeof v.stock === "number" && Number.isFinite(v.stock)
                    ? v.stock
                    : row.stock,
                image: v.image ?? row.image,
              };
            }),
          );
        } catch {
          // ignore variant detail errors
        }
      }
    })();

    
    
  };

  return { hydrateFromVariantItems };
};
