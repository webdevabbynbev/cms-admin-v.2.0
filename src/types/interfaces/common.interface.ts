export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface IdEntity {
  id: string | number;
}

export interface TimestampedEntity {
  createdAt: string;
  updatedAt: string;
}
