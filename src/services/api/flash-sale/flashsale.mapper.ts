import type { FlashSaleRecord } from "../../../components/Forms/FlashSale/flashTypes";

const getNonEmptyArray = (...arrays: any[]) => {
  for (const arr of arrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr;
    }
  }
  return [];
};

export const normalizeFlashSale = (raw: any): FlashSaleRecord => {
  return {
    id: Number(raw?.id ?? raw?.flashsale_id ?? raw?.flash_sale_id ?? 0),
    title: raw?.title ?? raw?.name ?? "",
    description: raw?.description ?? "",
    hasButton: raw?.hasButton ?? raw?.has_button ?? false,
    buttonText: raw?.buttonText ?? raw?.button_text ?? null,
    buttonUrl: raw?.buttonUrl ?? raw?.button_url ?? null,
    startDatetime:
      raw?.startDatetime ?? raw?.start_datetime ?? raw?.startDateTime ?? "",
    endDatetime: raw?.endDatetime ?? raw?.end_datetime ?? raw?.endDateTime ?? "",
    isPublish: raw?.isPublish ?? raw?.is_publish ?? false,
    products: getNonEmptyArray(
      raw?.products,
      raw?.flashsale_products,
      raw?.flashsaleProducts,
      raw?.details,
    ),
    variants: getNonEmptyArray(
      raw?.variants,
      raw?.flashsale_variants,
      raw?.flashsaleVariants,
      raw?.product_variants,
    ),
  };
};
