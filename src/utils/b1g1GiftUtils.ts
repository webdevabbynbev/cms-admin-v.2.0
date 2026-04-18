export function safeAttr(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function pickMeaningfulText(...values: any[]): string | null {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (!text) continue;

    const normalized = text.toLowerCase();
    if (
      normalized === "-" ||
      normalized === "--" ||
      normalized === "- -" ||
      normalized === "null" ||
      normalized === "undefined"
    ) {
      continue;
    }

    return text;
  }

  return null;
}

function isTruthyGiftFlag(value: any): boolean {
  if (value === true || value === 1) {
    return true;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }

  return false;
}

export function isGiftLikeItem(item: any): boolean {
  const attr = safeAttr(item?.attributes);
  const price = Number(item?.price ?? 0);
  const subTotal = Number(
    item?.sub_total ?? item?.subtotal ?? item?.amount ?? 0,
  );
  const qty = Number(item?.qty ?? item?.quantity ?? 0);
  const hasExplicitGiftFlag = [
    item?.isGiftItem,
    item?.is_gift_item,
    item?.is_gift,
    item?.is_b1g1_gift,
    attr?.is_gift,
    attr?.is_gift_item,
    attr?.is_b1g1_gift,
  ].some((value) => isTruthyGiftFlag(value));

  const isZeroValueLine = qty > 0 && subTotal === 0;

  if (hasExplicitGiftFlag && isZeroValueLine) {
    return true;
  }

  const hasGiftMetadata = Boolean(
    attr?.gift_name ||
      attr?.gift_product_id ||
      attr?.gift_brand_name ||
      attr?.gift_sku ||
      attr?.gift_image_url,
  );

  return hasGiftMetadata && isZeroValueLine && price >= 0;
}

export function getGiftAwareProductName(item: any): string {
  const attr = safeAttr(item?.attributes);
  const isGift = isGiftLikeItem(item);

  const regularName =
    pickMeaningfulText(
      item?.product_name,
      item?.productName,
      item?.name,
      item?.product?.name,
      item?.product?.productName,
      attr?.name,
      attr?.product_name,
    ) || "Produk";

  const giftName =
    pickMeaningfulText(
      attr?.gift_name,
      attr?.name,
      item?.name,
      item?.product?.name,
      item?.product_name,
      item?.product?.productName,
      attr?.product_name,
      regularName,
    ) || "Produk Hadiah";

  return isGift ? `GIFT - ${giftName}` : regularName;
}

export function getGiftAwareBrandName(item: any): string {
  const attr = safeAttr(item?.attributes);

  if (isGiftLikeItem(item)) {
    return (
      pickMeaningfulText(
        attr?.gift_brand_name,
        attr?.brand_name,
        item?.product?.brand?.name,
        item?.brand_name,
        item?.brand,
      ) || "-"
    );
  }

  return (
    pickMeaningfulText(
      item?.brand,
      item?.brand_name,
      item?.product?.brand?.name,
      item?.product?.brandName,
      attr?.brand_name,
    ) || "-"
  );
}

const pick = (v: any) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : null;

export function getProductVariantDisplay(
  item: any,
  isGift: boolean = false,
): string {
  const attr = safeAttr(item?.attributes);

  // Helper: return "Default" if it is default
  const clean = (v: string) => {
    if (!v) return "";
    return v.trim().toLowerCase() === "default" ? "Default" : v.trim();
  };

  if (isGift) {
    // 1. Check direct variant names first
    const giftVariantName = attr?.gift_variant_name || attr?.variant_name;
    if (giftVariantName) {
      const v = clean(giftVariantName);
      if (v) return v;
    }

    // 2. Try extracting from name format "Brand - Product - Variant"
    const rawName = (
      attr?.gift_name ||
      attr?.name ||
      item?.product?.name ||
      ""
    ).trim();
    const brandName = (
      attr?.gift_brand_name ||
      attr?.brand_name ||
      item?.product?.brand?.name ||
      item?.product?.brandName ||
      ""
    ).trim();
    const productName = (
      attr?.product_name ||
      item?.product?.productName ||
      ""
    ).trim();

    if (rawName) {
      const brandLower = brandName.toLowerCase();
      const rawLower = rawName.toLowerCase();

      let nameStr = rawName;
      let nameStrLower = rawLower;

      // Remove brand prefix: "Brand - ..."
      if (brandLower && nameStrLower.startsWith(`${brandLower} - `)) {
        nameStr = nameStr.substring(brandLower.length + 3).trim();
        nameStrLower = nameStrLower.substring(brandLower.length + 3).trim();
      }

      // Remove product name prefix: "Product - Variant"
      if (productName) {
        const prodLower = productName.toLowerCase();
        if (nameStrLower.startsWith(`${prodLower} - `)) {
          const v = clean(nameStr.substring(prodLower.length + 3).trim());
          if (v) return v;
        }
      }

      // If after removing brand we still have " - " separator, the last part is variant
      const dashIdx = nameStr.lastIndexOf(" - ");
      if (dashIdx !== -1) {
        const v = clean(nameStr.substring(dashIdx + 3).trim());
        if (v) return v;
      }
    }

    // 3. Check sku specifically as fallback for gift
    const giftSku = attr?.gift_sku || item?.variant?.sku;
    if (giftSku) {
      const v = clean(giftSku);
      if (v) return v;
    }

    return "";
  }

  // ── Non-gift (regular) items ──

  // 1. Highest priority: Attributes array check (e.g. Color: Red / Size: L)
  // Maps to specifically chosen variation items for regular products
  if (item?.variant?.attributes) {
    let vAttrs = item.variant.attributes;
    if (typeof vAttrs === "string") {
      try {
        vAttrs = JSON.parse(vAttrs);
      } catch {
        vAttrs = [];
      }
    }

    if (Array.isArray(vAttrs)) {
      const vals = vAttrs
        .map((a: any) => {
          if (typeof a === "string") return a;
          // Return the value inside the attribute object
          return (
            a?.value ||
            a?.attribute_value ||
            a?.attributeValue ||
            (a?.attribute?.name ? a.value : null)
          );
        })
        .filter(Boolean);

      if (vals.length > 0) {
        return vals
          .map((v: string) =>
            v.trim().toLowerCase() === "default" ? "Default" : v,
          )
          .join(" / ");
      }
    }
  }

  // 2. Pre-configured variant name in attributes (e.g. from cart)
  const isB1G1Attr = !!(attr?.buy_product_id || attr?.buy_product_variant_id);
  if (!isB1G1Attr && attr?.variant_name) {
    const v = clean(attr.variant_name);
    if (v) return v;
  }

  // 3. Direct name fields in variant object or labels
  if (item?.variant?.variant_name) {
    const v = clean(item.variant.variant_name);
    if (v) return v;
  }
  if (item?.variant?.name) {
    const v = clean(item.variant.name);
    if (v) return v;
  }
  if (item?.variant?.variantLabel) {
    const v = clean(item.variant.variantLabel);
    if (v) return v;
  }
  if (item?.variant?.label) {
    const v = clean(item.variant.label);
    if (v) return v;
  }

  // 4. Check sku specifically as fallback
  if (item?.variant?.sku) {
    const v = clean(item.variant.sku);
    if (v) return v;
  }

  // 5. Fallback: extract from attributes.name (Pattern: "Brand - Product - Variant")
  // Skip if this is B1G1 info (which contains DIFFERENT product's name)
  if (!isB1G1Attr && attr?.name) {
    const rawName = attr.name.trim();
    const prodName = (item?.product?.name || "").trim();
    const brandName = (
      attr?.brand_name ||
      item?.product?.brand?.name ||
      ""
    ).trim();

    const rawLower = rawName.toLowerCase();
    const prodLower = prodName.toLowerCase();
    const brandLower = brandName.toLowerCase();

    let nameStr = rawName;
    let nameLower = rawLower;

    // Remove brand prefix
    if (brandLower && nameLower.startsWith(`${brandLower} - `)) {
      nameStr = nameStr.substring(brandLower.length + 3).trim();
      nameLower = nameStr.toLowerCase();
    }

    // Try removing product name prefix
    if (prodLower && nameLower.startsWith(`${prodLower} - `)) {
      const v = clean(nameStr.substring(prodLower.length + 3).trim());
      if (v) return v;
    }

    // If there is still a dash, assume the last part is the variant
    const lastDash = nameStr.lastIndexOf(" - ");
    if (lastDash !== -1) {
      const potentialVariant = nameStr.substring(lastDash + 3).trim();
      // Only return if it's not the product name itself
      if (potentialVariant.toLowerCase() !== prodLower) {
        const v = clean(potentialVariant);
        if (v) return v;
      }
    }
  }

  return "";
}

// Helper: extract gift product info from a promo
const extractGiftsFromPromo = (promo: any) => {
  const gifts: any[] = [];
  const giftsList = Array.isArray(promo?.gifts) ? promo.gifts : [];
  for (const g of giftsList) {
    const gp = pick(g?.giftProduct) || pick(g?.getGiftProduct);
    if (gp) {
      gifts.push({
        id: gp.id ?? null,
        name: gp.name ?? gp.productName ?? "Free Gift",
        brand: gp.brandName ?? gp.brand?.name ?? null,
        image: gp.imageUrl ?? gp.image_url ?? gp.image ?? gp.thumbnail ?? null,
        variantName: gp.variantName ?? "",
        productName: gp.productName ?? "",
        sku: gp.sku ?? gp.productVariantSku ?? "",
        _isVirtualGift: true, // Marker for CMS rendering
        isGiftItem: true,
      });
    }
  }

  if (gifts.length === 0) {
    const itemsList = Array.isArray(promo?.items) ? promo.items : [];
    for (const item of itemsList) {
      const gp = pick(item?.getGiftProduct) || pick(item?.giftProduct);
      if (gp) {
        gifts.push({
          id: gp.id ?? null,
          name: gp.name ?? gp.productName ?? "Free Gift",
          brand: gp.brandName ?? gp.brand?.name ?? null,
          image:
            gp.imageUrl ?? gp.image_url ?? gp.image ?? gp.thumbnail ?? null,
          variantName: gp.variantName ?? "",
          productName: gp.productName ?? "",
          sku: gp.sku ?? gp.productVariantSku ?? "",
          _isVirtualGift: true,
          isGiftItem: true,
        });
      }
    }
  }
  return gifts;
};

const isPromoActive = (promo: any) => {
  if (!promo || typeof promo !== "object") return false;
  if (promo.isActive === false) return false;
  if (promo.isEcommerce === false) return false;
  return true;
};

export function extractGiftsFromDetails(details: any[] = []) {
  const items = Array.isArray(details) ? details : [];

  // 1. Ambil existing gifts dari backend (yang flag isGiftItem nya true)
  const existingGiftItems = items.filter(
    (d: any) =>
      d.isGiftItem === true ||
      d.is_gift_item === true ||
      d.isGiftItem === 1 ||
      d.is_gift_item === 1 ||
      d.is_b1g1_gift === true,
  );

  // 2. Filter item reguler (non-gift)
  const regularItems = items.filter(
    (d: any) =>
      d.isGiftItem !== true &&
      d.is_gift_item !== true &&
      d.isGiftItem !== 1 &&
      d.is_gift_item !== 1 &&
      d.is_b1g1_gift !== true,
  );

  // Kita akan mencoba mengumpulkan semua gift (baik dari database/detail fisik maupun promo virtual)
  // Ini karena terkadang sebagian gift tersimpan di database sedangkan sebagian lagi terpasang via metadata promo

  const computedGiftsMap = new Map(); // Untuk prevent duplikasi gift yang sama persis

  // Format existing gifts ke Map agar kita bisa cek duplikasi dengan yang di virtual
  const formattedExistingGifts = existingGiftItems.map((g) => {
    const formatted = {
      ...g,
      isGiftItem: true,
      _isVirtualGift: false,
    };

    // Attempt to register existing gift in the map using its product or variant ID to prevent duplicates
    let dedupKey = "";
    if (g.productVariantId || g.productId) {
      dedupKey = `${g.productId || ""}-${g.productVariantId || ""}`;
    }

    // Check fallback for exact property name
    const attr = safeAttr(g.attributes);
    const attrName = String(
      attr?.gift_product_id ||
        attr?.gift_name ||
        attr?.name ||
        attr?.product_name ||
        g.name ||
        "",
    );

    if (dedupKey) computedGiftsMap.set(dedupKey, true);
    if (attrName) computedGiftsMap.set(attrName, true);

    return formatted;
  });

  // JIKA TIDAK ADA EXISTING GIFTS di DB, BISA JADI KARENA MIGRATION/LAINNYA:
  // Evaluasi dari promo details layaknya di Cart/Order History Frontend

  // Prep standard properties for subtotal counting
  const prepItems = regularItems.map((d: any) => {
    const p = d.product || {};
    const price = Number(d.price) || 0;
    const qty = Number(d.qty) || 0;
    const brandId = p.brandId ?? p.brand_id ?? null;
    return { ...d, price, qty, brandId };
  });

  // prepItems containing the payload promo logic iteration
  const allPromosMap = new Map();
  prepItems.forEach((d: any) => {
    const sources = [
      ...(Array.isArray(d?.product?.b1g1_promos) ? d.product.b1g1_promos : []),
      ...(Array.isArray(d?.product?.b1g1Promos) ? d.product.b1g1Promos : []),
      ...(Array.isArray(d?.b1g1_promos) ? d.b1g1_promos : []),
      ...(Array.isArray(d?.b1g1Promos) ? d.b1g1Promos : []),
    ];

    // Fallback standalone promo objects
    const singlePromo =
      d?.b1g1_promo ||
      d?.b1g1Promo ||
      d?.product?.b1g1_promo ||
      d?.product?.b1g1Promo;
    if (singlePromo?.id && !sources.some((p) => p?.id === singlePromo.id)) {
      sources.push(singlePromo);
    }

    // Juga check attributes jika tidak ada relasi di level atas
    const attr = safeAttr(d.attributes);
    if (!sources.length && attr?.b1g1_promo) {
      sources.push(attr.b1g1_promo);
    }

    for (const promo of sources) {
      if (!promo?.id || allPromosMap.has(promo.id)) continue;
      if (!isPromoActive(promo)) continue;

      const gifts = extractGiftsFromPromo(promo);
      if (gifts.length === 0) continue;

      allPromosMap.set(promo.id, {
        id: promo.id,
        name: promo.name,
        applyTo: String(promo.applyTo || "all").toLowerCase(),
        brandId: promo.brandId ?? null,
        minimumPurchase: Number(promo.minimumPurchase) || 0,
        gifts,
      });
    }
  });

  // Jika tidak ada promo sama sekali dari backend, rely pada basic attributes b1g1
  if (allPromosMap.size === 0) {
    const virtualGifts: any[] = [];
    prepItems.forEach((d: any) => {
      const attr = safeAttr(d.attributes);
      if (attr?.is_b1g1 || attr?.gift_product_id || attr?.is_gift_item) {
        const dedupKey = attr.gift_product_id
          ? String(attr.gift_product_id)
          : attr.gift_name || attr.name || attr.product_name || "Hadiah";
        if (!computedGiftsMap.has(dedupKey)) {
          computedGiftsMap.set(dedupKey, true);
          virtualGifts.push({
            ...d, // Copy base struct for schema compatibility
            id: `v-gift-attr-${d.id}`,
            isGiftItem: true,
            _isVirtualGift: true,
            price: 0,
            attributes: {
              ...attr,
              name:
                attr.gift_name || attr.name || attr.product_name || "Hadiah",
              sku: attr.gift_sku || attr.sku || "-",
              brand_name:
                attr.gift_brand_name ||
                attr.brand_name ||
                (d.product as any)?.brand?.name ||
                "Hadiah",
              variant_name: attr.gift_variant_name || attr.variant_name || "",
            },
          });
        }
      }
    });

    return {
      regularItems,
      giftItems: [...formattedExistingGifts, ...virtualGifts],
      allDisplayItems: [
        ...regularItems,
        ...formattedExistingGifts,
        ...virtualGifts,
      ],
    };
  }

  // Step 2: Calculate subtotals (non-gift items only)
  const totalSubtotal = prepItems.reduce(
    (s: number, it: any) => s + it.price * it.qty,
    0,
  );

  const brandSubtotals: Record<string, number> = {};
  prepItems.forEach((it: any) => {
    const bId = String(it.brandId ?? "");
    if (bId) {
      brandSubtotals[bId] = (brandSubtotals[bId] || 0) + it.price * it.qty;
    }
  });

  // Step 3: Determine eligible promos
  const eligibleBrandPromos: any[] = [];
  const eligibleGlobalPromos: any[] = [];

  allPromosMap.forEach((promo) => {
    if (promo.applyTo === "brand" && promo.brandId) {
      const brandTotal = brandSubtotals[String(promo.brandId)] || 0;
      if (brandTotal >= promo.minimumPurchase) {
        eligibleBrandPromos.push(promo);
      }
    } else {
      if (totalSubtotal >= promo.minimumPurchase) {
        eligibleGlobalPromos.push(promo);
      }
    }
  });

  // Step 4: For brand promos, keep only highest tier per brand
  const brandHighest: Record<string, any> = {};
  eligibleBrandPromos.forEach((promo) => {
    const bId = String(promo.brandId);
    if (
      !brandHighest[bId] ||
      promo.minimumPurchase > brandHighest[bId].minimumPurchase
    ) {
      brandHighest[bId] = promo;
    }
  });

  // Step 5: Build final eligible promo list
  const finalEligiblePromos = [
    ...Object.values(brandHighest),
    ...eligibleGlobalPromos,
  ];

  // Final array of virtual gifts
  const finalVirtualGifts: any[] = [];

  finalEligiblePromos.forEach((promo) => {
    promo.gifts.forEach((gift: any) => {
      // Prevent duplicates by checking if we already added a gift with same ID
      const exactKey = `${gift.id || gift.name}`;
      if (!computedGiftsMap.has(exactKey)) {
        computedGiftsMap.set(exactKey, true);
        finalVirtualGifts.push({
          id: `v-gift-promo-${gift.id || promo.id}`,
          qty: 1, // Assume 1 gift per promo
          price: 0,
          isGiftItem: true,
          _isVirtualGift: true,
          product: {
            name: gift.name,
            brand: { name: gift.brand },
            thumbnail: gift.image,
          },
          attributes: {
            name: gift.name,
            brand_name: gift.brand,
            image_url: gift.image,
            variant_name: gift.variantName || "",
            product_name: gift.productName || "",
            sku: gift.sku || "",
          },
        });
      }
    });
  });

  return {
    regularItems,
    giftItems: [...formattedExistingGifts, ...finalVirtualGifts],
    allDisplayItems: [
      ...regularItems,
      ...formattedExistingGifts,
      ...finalVirtualGifts,
    ],
  };
}
