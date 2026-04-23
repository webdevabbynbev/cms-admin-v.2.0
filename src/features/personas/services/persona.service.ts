import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { Persona, PersonaListQuery, PersonaPayload } from '../types';
import { normalizePersona } from '../utils/normalize';

const PERSONA_ENDPOINTS = {
  list: '/admin/personas',
  detail: (slug: string) => `/admin/personas/${encodeURIComponent(slug)}`,
} as const;

function buildListParams(filters: PersonaListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const personaService = {
  async list(
    filters: PersonaListQuery,
  ): Promise<AdonisPaginatedPayload<Persona>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${PERSONA_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizePersona),
    };
  },

  async create(payload: PersonaPayload): Promise<Persona> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      PERSONA_ENDPOINTS.list,
      payload,
    );
    return normalizePersona(response.data.serve);
  },

  async update(slug: string, payload: PersonaPayload): Promise<Persona> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      PERSONA_ENDPOINTS.detail(slug),
      payload,
    );
    return normalizePersona(response.data.serve);
  },

  async remove(slug: string): Promise<void> {
    await axiosClient.delete(PERSONA_ENDPOINTS.detail(slug));
  },
};
