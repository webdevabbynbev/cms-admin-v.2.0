import moment from 'moment-timezone';
import { WIB_TZ } from '@/utils/timezone';
import type { FlashSaleFormPayload } from '../types';
import type { FlashSaleFormValues } from '../schemas';

function toIsoWib(value: string): string {
  const parsed = moment.tz(value, 'YYYY-MM-DDTHH:mm', WIB_TZ);
  return parsed.isValid() ? parsed.toISOString() : value;
}

export function buildFlashSalePayload(
  values: FlashSaleFormValues,
): FlashSaleFormPayload {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    has_button: values.hasButton,
    button_text: values.hasButton ? values.buttonText.trim() : null,
    button_url: values.hasButton ? values.buttonUrl.trim() : null,
    start_datetime: toIsoWib(values.startDatetime),
    end_datetime: toIsoWib(values.endDatetime),
    is_publish: values.isPublish,
    variants: values.variants
      .filter((v) => v.isActive)
      .map((v, index) => ({
        variant_id: v.variantId,
        flash_price: v.flashPrice,
        stock: v.flashStock,
        position: index + 1,
      })),
  };
}
