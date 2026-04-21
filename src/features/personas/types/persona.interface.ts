export interface Persona {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PersonaListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface PersonaPayload {
  name: string;
  description?: string | null;
}
