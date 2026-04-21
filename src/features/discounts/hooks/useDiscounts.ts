import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { discountService } from '../services';
import type {
  DiscountFormPayload,
  DiscountImportParams,
  DiscountListQuery,
  DiscountOptionQuery,
  DiscountStatusPayload,
} from '../types';

export const useDiscounts = (filters: DiscountListQuery) => {
  return useQuery({
    queryKey: QUERY_KEYS.discounts.list(filters),
    queryFn: () => discountService.list(filters),
    placeholderData: keepPreviousData,
  });
};

export const useDiscount = (identifier: number | string | null | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.discounts.detail(identifier ?? 'none'),
    queryFn: () => discountService.getById(identifier as number | string),
    enabled: identifier != null && identifier !== '',
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DiscountFormPayload) =>
      discountService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discounts.root });
    },
  });
};

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      identifier,
      payload,
    }: {
      identifier: number | string;
      payload: DiscountFormPayload;
    }) => discountService.update(identifier, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discounts.root });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.discounts.detail(variables.identifier),
      });
    },
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (identifier: number | string) =>
      discountService.remove(identifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discounts.root });
    },
  });
};

export const useToggleDiscountStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DiscountStatusPayload) =>
      discountService.updateStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discounts.root });
    },
  });
};

export const useExportDiscountItems = () => {
  return useMutation({
    mutationFn: ({
      identifier,
      params,
    }: {
      identifier: number | string;
      params: DiscountImportParams;
    }) => discountService.exportItems(identifier, params),
  });
};

export const useDownloadDiscountTemplate = () => {
  return useMutation({
    mutationFn: ({
      identifier,
      params,
    }: {
      identifier: number | string;
      params: DiscountImportParams;
    }) => discountService.downloadTemplate(identifier, params),
  });
};

export const useImportDiscountItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      identifier,
      file,
      scope,
      onProgress,
    }: {
      identifier: number | string;
      file: File;
      scope: DiscountImportParams['scope'];
      onProgress?: (percent: number) => void;
    }) => discountService.importItems(identifier, file, scope, onProgress),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.discounts.detail(variables.identifier),
      });
    },
  });
};

export const useDiscountBrandOptions = (
  filters: DiscountOptionQuery,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.discounts.brandOptions(filters),
    queryFn: () => discountService.getBrandOptions(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useDiscountProductOptions = (
  filters: DiscountOptionQuery,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.discounts.productOptions(filters),
    queryFn: () => discountService.getProductOptions(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useDiscountVariantOptions = (
  filters: DiscountOptionQuery,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.discounts.variantOptions(filters),
    queryFn: () => discountService.getVariantOptions(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};
