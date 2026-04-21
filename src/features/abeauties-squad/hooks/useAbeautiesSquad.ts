import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { abeautiesSquadService } from '../services';
import type {
  AbeautiesSquadListQuery,
  AbeautiesSquadStatusPayload,
} from '../types';

export const useAbeautiesSquad = (filters: AbeautiesSquadListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.abeautiesSquad.list(filters),
    queryFn: () => abeautiesSquadService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useUpdateSquadStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: AbeautiesSquadStatusPayload;
    }) => abeautiesSquadService.updateStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.abeautiesSquad.root });
    },
  });
};
