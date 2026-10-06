import api from "@/services/api";
import type { LibraryResource } from "@/services/library";

export interface DashboardStats {
  pending_accreditation: number;
  pending_library: number;
  open_disputes: number;
  today_payments_total: number;
}

export const fetchDashboardStats = () =>
  api.get<DashboardStats>("/admin-panel/dashboard-stats/").then((r) => r.data);

export interface PendingAccreditationUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  primary_role: "teacher" | "director";
  created_at: string;
}

export const fetchPendingAccreditation = () =>
  api.get<PendingAccreditationUser[]>("/admin-panel/pending-accreditation/").then((r) => r.data);

export const validateAccreditation = (userId: number) =>
  api.post(`/admin-panel/accreditation/${userId}/validate/`);

export interface PendingLibraryResource {
  id: string;
  title: string;
  resource_type: string;
  level: string;
  subject: string;
  author_name: string;
  establishment_name: string;
  created_at: string;
}

export const fetchPendingLibrary = () =>
  api.get<PendingLibraryResource[]>("/admin-panel/pending-library/").then((r) => r.data);

export const moderateLibraryResource = (resourceId: string, approve: boolean) =>
  api.post(`/admin-panel/library/${resourceId}/moderate/`, { approve });

export interface AdminLibraryResource extends LibraryResource {
  establishment_name: string;
  establishment_id: number;
}

export const fetchAdminLibrary = () =>
  api.get<AdminLibraryResource[]>("/admin-panel/library/").then((r) => r.data);

export interface AdminLibraryEstablishment {
  id: number;
  school_name: string;
}

export const fetchAdminLibraryEstablishments = () =>
  api.get<AdminLibraryEstablishment[]>("/admin-panel/library-establishments/").then((r) => r.data);
