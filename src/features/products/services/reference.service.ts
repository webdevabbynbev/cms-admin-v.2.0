import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type {
  Attribute,
  AttributeValue,
  Brand,
  CategoryType,
  Concern,
  Persona,
  ProfileCategory,
} from '../types';

const REFERENCE_ENDPOINTS = {
  brands: '/admin/brands',
  categoryTypes: '/admin/category-types/list',
  attributes: '/admin/attribute/list',
  attribute: '/admin/attribute',
  attributeValue: (attributeId: number) => `/admin/attribute/list-value/${attributeId}`,
  personas: '/admin/personas',
  concerns: '/admin/concern',
  profileCategories: '/admin/profile-categories',
} as const;

const DEFAULT_LARGE_PAGE_SIZE = 1000;

export const referenceService = {
  async getBrands(): Promise<Brand[]> {
    const response = await axiosClient.get<ServeWrapper<AdonisPaginatedPayload<Brand>>>(
      REFERENCE_ENDPOINTS.brands,
      { params: { per_page: DEFAULT_LARGE_PAGE_SIZE } },
    );
    return response.data.serve?.data ?? [];
  },

  async getCategoryTypes(): Promise<CategoryType[]> {
    const response = await axiosClient.get<ServeWrapper<CategoryType[]>>(
      REFERENCE_ENDPOINTS.categoryTypes,
    );
    return response.data.serve ?? [];
  },

  async getAttributes(): Promise<Attribute[]> {
    const response = await axiosClient.get<ServeWrapper<Attribute[]>>(
      REFERENCE_ENDPOINTS.attributes,
    );
    return response.data.serve ?? [];
  },

  async createAttribute(name: string): Promise<Attribute> {
    const response = await axiosClient.post<ServeWrapper<Attribute>>(
      REFERENCE_ENDPOINTS.attribute,
      { name },
    );
    const serve = response.data.serve;
    return {
      id: serve.id,
      name: serve.name,
      values: serve.values ?? [],
    };
  },

  async createAttributeValue(
    attributeId: number,
    value: string,
  ): Promise<AttributeValue> {
    const response = await axiosClient.post<ServeWrapper<AttributeValue>>(
      REFERENCE_ENDPOINTS.attributeValue(attributeId),
      { value },
    );
    const serve = response.data.serve;
    return {
      id: serve.id,
      value: serve.value,
      label: serve.label,
    };
  },

  async getPersonas(): Promise<Persona[]> {
    const response = await axiosClient.get<ServeWrapper<AdonisPaginatedPayload<Persona>>>(
      REFERENCE_ENDPOINTS.personas,
      { params: { per_page: DEFAULT_LARGE_PAGE_SIZE } },
    );
    return response.data.serve?.data ?? [];
  },

  async getConcerns(): Promise<Concern[]> {
    const response = await axiosClient.get<ServeWrapper<AdonisPaginatedPayload<Concern>>>(
      REFERENCE_ENDPOINTS.concerns,
      { params: { per_page: DEFAULT_LARGE_PAGE_SIZE } },
    );
    return response.data.serve?.data ?? [];
  },

  async getProfileCategories(): Promise<ProfileCategory[]> {
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<ProfileCategory>>
    >(REFERENCE_ENDPOINTS.profileCategories, {
      params: { per_page: DEFAULT_LARGE_PAGE_SIZE },
    });
    return response.data.serve?.data ?? [];
  },
};
