import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { referenceService } from '../services';

const REFERENCE_STALE_TIME = 1000 * 60 * 15;

export const useBrands = () => {
  return useQuery({
    queryKey: QUERY_KEYS.references.brands,
    queryFn: () => referenceService.getBrands(),
    staleTime: REFERENCE_STALE_TIME,
  });
};

export const useCategoryTypes = () => {
  return useQuery({
    queryKey: QUERY_KEYS.references.categoryTypes,
    queryFn: () => referenceService.getCategoryTypes(),
    staleTime: REFERENCE_STALE_TIME,
  });
};

export const useAttributes = () => {
  return useQuery({
    queryKey: QUERY_KEYS.references.attributes,
    queryFn: () => referenceService.getAttributes(),
    staleTime: REFERENCE_STALE_TIME,
  });
};

export const usePersonas = () => {
  return useQuery({
    queryKey: QUERY_KEYS.references.personas,
    queryFn: () => referenceService.getPersonas(),
    staleTime: REFERENCE_STALE_TIME,
  });
};

export const useConcerns = () => {
  return useQuery({
    queryKey: QUERY_KEYS.references.concerns,
    queryFn: () => referenceService.getConcerns(),
    staleTime: REFERENCE_STALE_TIME,
  });
};

export const useProfileCategories = () => {
  return useQuery({
    queryKey: QUERY_KEYS.references.profileCategories,
    queryFn: () => referenceService.getProfileCategories(),
    staleTime: REFERENCE_STALE_TIME,
  });
};

export const useCreateAttribute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => referenceService.createAttribute(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.references.attributes });
    },
  });
};

export const useCreateAttributeValue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, value }: { attributeId: number; value: string }) =>
      referenceService.createAttributeValue(attributeId, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.references.attributes });
    },
  });
};
