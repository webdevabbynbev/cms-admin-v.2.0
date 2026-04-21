import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { CategoryType } from '../types';
import type { ProductFormValues } from '../schemas';
import { useCategoryTypes } from '../hooks';

export interface CategoryFlags {
  isMakeup: boolean;
  isPerfume: boolean;
  isSkincare: boolean;
}

function flattenCategoryLabels(
  categories: CategoryType[],
  prefix = '',
): Map<number, string> {
  const result = new Map<number, string>();
  for (const item of categories) {
    const label = prefix ? `${prefix} / ${item.name}` : item.name;
    result.set(item.id, label.toLowerCase());
    if (item.children && item.children.length > 0) {
      for (const [id, l] of flattenCategoryLabels(item.children, label)) {
        result.set(id, l);
      }
    }
  }
  return result;
}

export function detectCategoryFlags(
  selectedIds: number[],
  categories: CategoryType[],
): CategoryFlags {
  const labelMap = flattenCategoryLabels(categories);
  const labels = selectedIds
    .map((id) => labelMap.get(id))
    .filter((l): l is string => !!l);
  return {
    isMakeup: labels.some((l) => l.includes('makeup')),
    isPerfume: labels.some((l) => l.includes('perfume') || l.includes('fragrance')),
    isSkincare: labels.some((l) => l.includes('skincare')),
  };
}

export function useCategoryFlags(): CategoryFlags {
  const { data: categories = [] } = useCategoryTypes();
  const form = useFormContext<ProductFormValues>();
  const singleId = useWatch({ control: form.control, name: 'category_type_id' });
  const multiIds = useWatch({ control: form.control, name: 'category_type_ids' });

  const ids = useMemo(() => {
    if (multiIds && multiIds.length > 0) return multiIds;
    if (singleId != null) return [singleId];
    return [];
  }, [multiIds, singleId]);

  return useMemo(() => detectCategoryFlags(ids, categories), [ids, categories]);
}
