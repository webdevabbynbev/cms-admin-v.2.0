import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { personaService } from '../services';
import type { PersonaListQuery, PersonaPayload } from '../types';

export const usePersonas = (filters: PersonaListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.personas.list(filters),
    queryFn: () => personaService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useCreatePersona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PersonaPayload) => personaService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personas.root });
    },
  });
};

export const useUpdatePersona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      payload,
    }: {
      slug: string;
      payload: PersonaPayload;
    }) => personaService.update(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personas.root });
    },
  });
};

export const useDeletePersona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => personaService.remove(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personas.root });
    },
  });
};
