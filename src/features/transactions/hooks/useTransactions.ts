import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { transactionService } from '../services';
import type { TransactionListQuery } from '../types';

export const useTransactions = (filters: TransactionListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.transactions.list(filters),
    queryFn: () => transactionService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useTransactionDetail = (id: number | string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.transactions.detail(id ?? 0),
    queryFn: () => transactionService.getDetail(id!),
    enabled: id !== null,
  });
