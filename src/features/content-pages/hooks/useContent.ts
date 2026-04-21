import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { contentService } from '../services';
import type { ContentPayload, ContentSlug } from '../types';

export const useContent = (slug: ContentSlug) =>
  useQuery({
    queryKey: QUERY_KEYS.contentPages.detail(slug),
    queryFn: () => contentService.get(slug),
  });

export const useUpdateContent = (slug: ContentSlug) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContentPayload) => contentService.update(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.contentPages.detail(slug),
      });
    },
  });
};
