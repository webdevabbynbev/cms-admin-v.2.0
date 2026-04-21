export interface Setting {
  id: number;
  key: string;
  group: string;
  value: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SettingListQuery {
  name?: string;
  page: number;
  perPage: number;
}

export interface SettingPayload {
  id?: number;
  key: string;
  group: string;
  value: string;
}
