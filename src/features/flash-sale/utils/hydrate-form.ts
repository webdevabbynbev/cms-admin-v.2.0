import { toWib } from '@/utils/timezone';
import type { FlashSale } from '../types';
import type { FlashSaleFormValues } from '../schemas';

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const wib = toWib(value);
  if (!wib || !wib.isValid()) return '';
  return wib.format('YYYY-MM-DDTHH:mm');
}

export function hydrateFlashSaleForm(sale: FlashSale): FlashSaleFormValues {
  return {
    title: sale.title ?? '',
    description: sale.description ?? '',
    hasButton: sale.hasButton,
    buttonText: sale.buttonText ?? '',
    buttonUrl: sale.buttonUrl ?? '',
    startDatetime: toDatetimeLocal(sale.startDatetime),
    endDatetime: toDatetimeLocal(sale.endDatetime),
    isPublish: sale.isPublish,
    variants: sale.variants.map((v) => ({
      variantId: v.variantId,
      productId: v.productId,
      productName: v.productName,
      sku: v.sku,
      image: v.image,
      label: v.label,
      basePrice: v.basePrice,
      baseStock: v.baseStock,
      flashPrice: v.flashPrice,
      flashStock: v.flashStock,
      isActive: v.isActive,
    })),
  };
}
