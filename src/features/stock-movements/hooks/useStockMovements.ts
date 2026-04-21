import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { stockMovementService } from '../services';
import type { StockMovementListQuery, StockAdjustmentPayload } from '../types';

export const useStockMovements = (filters: StockMovementListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.stockMovements.list(filters),
    queryFn: () => stockMovementService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useMarkStockMovementReceived = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => stockMovementService.markReceived(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stockMovements.root });
    },
  });
};

export const useCreateStockAdjustment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockAdjustmentPayload) => stockMovementService.adjust(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stockMovements.root });
    },
  });
};
