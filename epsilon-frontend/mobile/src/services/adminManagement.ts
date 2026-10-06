import api from "@/services/api";
import type { AdminScope } from "@/types/user";

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  admin_scope: AdminScope;
}

export const fetchAdminList = () => api.get<AdminUser[]>("/auth/admin/list/").then((r) => r.data);

export const createAdmin = (payload: {
  email: string;
  first_name: string;
  last_name: string;
  admin_scope: AdminScope;
}) =>
  api.post<{ id: number; email: string; admin_scope: AdminScope; detail: string }>(
    "/auth/admin/create/",
    payload
  ).then((r) => r.data);

export type CreatableRole = "teacher" | "director" | "parent" | "company" | "student";

export interface AdminCreateUserPayload {
  role: CreatableRole;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  // Directeur
  school_name?: string;
  address?: string;
  // Entreprise
  company_name?: string;
  // Élève
  declared_level?: string;
}

export const adminCreateUser = (payload: AdminCreateUserPayload) =>
  api
    .post<{ id: number; email: string; detail: string }>("/auth/admin/create-user/", payload)
    .then((r) => r.data);

export const togglePartnerStatus = (userId: number) =>
  api.post<{ id: number; is_partner: boolean }>(`/admin-panel/directory/${userId}/toggle-partner/`).then((r) => r.data);

export const toggleProfileVisibility = (userId: number) =>
  api
    .post<{ id: number; profile_visible: boolean }>(`/admin-panel/directory/${userId}/toggle-visibility/`)
    .then((r) => r.data);
