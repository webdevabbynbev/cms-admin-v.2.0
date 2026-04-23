export interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

export interface AdonisPaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
}

export interface AdonisPaginatedPayload<T> extends AdonisPaginationMeta {
  data: T[];
}
