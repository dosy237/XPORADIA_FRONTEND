import api from "@/services/api";

export type ManagedRole = "student" | "teacher" | "director" | "company";

export interface AdminUserListItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  primary_role: ManagedRole;
  is_active: boolean;
  created_at: string;
}

export const fetchAdminUsers = (role: ManagedRole, search?: string) =>
  api.get<AdminUserListItem[]>("/admin-panel/users/", { params: { role, search } }).then((r) => r.data);

export interface AdminUserDetail extends AdminUserListItem {
  role_detail: Record<string, unknown>;
  certifications?: {
    id: string;
    module_title: string;
    level: string;
    score_total: string;
    is_valid: boolean;
    issued_at: string;
    revoked_at: string | null;
  }[];
}

export const fetchAdminUserDetail = (userId: number) =>
  api.get<AdminUserDetail>(`/admin-panel/users/${userId}/`).then((r) => r.data);

export const suspendUser = (userId: number) =>
  api.post<{ id: number; is_active: boolean }>(`/admin-panel/users/${userId}/suspend/`).then((r) => r.data);

export const reactivateUser = (userId: number) =>
  api.post<{ id: number; is_active: boolean }>(`/admin-panel/users/${userId}/reactivate/`).then((r) => r.data);
