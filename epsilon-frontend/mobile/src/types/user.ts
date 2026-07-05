export type UserRole = "teacher" | "director" | "parent" | "company" | "trainer" | "admin";

export interface User {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  primary_role: UserRole;
  secondary_roles: UserRole[];
  all_roles: UserRole[];
  is_verified: boolean;
  is_documents_validated: boolean;
  two_fa_enabled: boolean;
  created_at: string;
}
