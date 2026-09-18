import api from "@/services/api";

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export const fetchAdminList = () => api.get<AdminUser[]>("/auth/admin/list/").then((r) => r.data);

export const createAdmin = (payload: { email: string; first_name: string; last_name: string }) =>
  api.post<{ id: number; email: string; detail: string }>("/auth/admin/create/", payload).then((r) => r.data);

export const togglePartnerStatus = (userId: number) =>
  api.post<{ id: number; is_partner: boolean }>(`/admin-panel/directory/${userId}/toggle-partner/`).then((r) => r.data);

export const toggleProfileVisibility = (userId: number) =>
  api
    .post<{ id: number; profile_visible: boolean }>(`/admin-panel/directory/${userId}/toggle-visibility/`)
    .then((r) => r.data);
