import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { faqService } from '../services';
import type { FaqListQuery, FaqPayload } from '../types';

export const useFaqs = (filters: FaqListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.faqs.list(filters),
    queryFn: () => faqService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FaqPayload) => faqService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faqs.root });
    },
  });
};

export const useUpdateFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: FaqPayload;
    }) => faqService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faqs.root });
    },
  });
};

export const useDeleteFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => faqService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faqs.root });
    },
  });
};
