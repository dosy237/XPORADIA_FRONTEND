export type UserRole = "teacher" | "director" | "parent" | "company" | "trainer" | "admin" | "student";

/** Périmètre d'un compte administrateur — sans effet pour tout autre rôle.
 * "full" a toujours tous les droits ; les autres valeurs délèguent un
 * sous-ensemble des tâches du tableau de bord de gestion. */
export type AdminScope = "full" | "moderation" | "accounts" | "catalog";

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
  /** Présent uniquement pour un compte élève. */
  child_id: number | null;
  /** Présent uniquement pour un compte administrateur. */
  admin_scope: AdminScope | null;
  is_verified: boolean;
  is_documents_validated: boolean;
  two_fa_enabled: boolean;
  profile_visible: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notify_push: boolean;
  created_at: string;
}
