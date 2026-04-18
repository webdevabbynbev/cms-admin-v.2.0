import http from "../http";

export type AbeautiesSquadParams = {
  page?: number;
  per_page?: number;
  name?: string;
};

export const getAbeautiesSquadList = (params: AbeautiesSquadParams = {}) => {
  return http.get("/admin/abeauty-squad", { params });
};

export type AbeautiesUserType = "abeauties" | "kol";

export const updateAbeautiesSquadStatus = (
  id: number | string,
  status: "approved" | "rejected",
  options: { user_type?: AbeautiesUserType } = {},
) => {
  return http.patch(`/admin/abeauty-squad/${id}/status`, {
    status,
    ...(options.user_type ? { user_type: options.user_type } : {}),
  });
};
