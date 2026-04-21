export interface ActivityLog {
  id: number;
  roleName: string;
  userName: string;
  activity: string;
  menu: string | null;
  data: string | null;
  dataArray: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ActivityLogListQuery {
  q?: string;
  page: number;
  perPage: number;
}
