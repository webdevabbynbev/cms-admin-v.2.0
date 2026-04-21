export interface CategoryType {
  id: number;
  name: string;
  parentId?: number | null;
  children?: CategoryType[];
}

export interface Persona {
  id: number;
  name: string;
}

export interface AttributeValue {
  id: number;
  value: string;
  label?: string;
}

export interface Attribute {
  id: number;
  name: string;
  values: AttributeValue[];
}

export interface ConcernOption {
  id: number;
  name: string;
  groupId?: number;
  groupName?: string;
}

export interface Concern {
  id: number;
  name: string;
  options: ConcernOption[];
}

export interface ProfileCategoryOption {
  id: number;
  name: string;
  groupId?: number;
}

export interface ProfileCategory {
  id: number;
  name: string;
  options: ProfileCategoryOption[];
}
