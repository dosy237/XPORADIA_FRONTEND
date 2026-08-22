import api from "@/services/api";

export interface DirectorProfile {
  school_name: string;
  address: string;
  levels_taught: string[];
  student_count: number | null;
  is_partner: boolean;
  // Coordonnées et statut affichés en en-tête du bulletin officiel (voir
  // apps.grading.pdf côté backend) — distincts de l'email de connexion du
  // directeur.
  phone: string;
  contact_email: string;
  establishment_code: string;
  is_public: boolean;
}

export type DirectorProfileUpdate = Partial<Omit<DirectorProfile, "is_partner">>;

export const fetchDirectorProfile = () =>
  api.get<DirectorProfile>("/auth/director-profile/").then((r) => r.data);

export const updateDirectorProfile = (payload: DirectorProfileUpdate) =>
  api.patch<DirectorProfile>("/auth/director-profile/", payload).then((r) => r.data);
