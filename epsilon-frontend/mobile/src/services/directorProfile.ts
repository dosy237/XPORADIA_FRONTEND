import { appendFileAsset, type LocalFileAsset } from "@/lib/formDataAsset";
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
  logo: string | null;
}

export type DirectorProfileUpdate = Partial<Omit<DirectorProfile, "is_partner" | "logo">>;

export const fetchDirectorProfile = () =>
  api.get<DirectorProfile>("/auth/director-profile/").then((r) => r.data);

export const updateDirectorProfile = (payload: DirectorProfileUpdate) =>
  api.patch<DirectorProfile>("/auth/director-profile/", payload).then((r) => r.data);

export const uploadDirectorLogo = async (asset: LocalFileAsset) => {
  const formData = new FormData();
  await appendFileAsset(formData, "logo", asset);
  return api
    .post<DirectorProfile>("/auth/director-profile/logo/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const deleteDirectorLogo = () =>
  api.delete<DirectorProfile>("/auth/director-profile/logo/").then((r) => r.data);
