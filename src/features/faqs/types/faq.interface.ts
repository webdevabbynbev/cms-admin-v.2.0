export interface Faq {
  id: number;
  question: string;
  answer: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FaqListQuery {
  name?: string;
  page: number;
  perPage: number;
}

export interface FaqPayload {
  question: string;
  answer: string;
}
