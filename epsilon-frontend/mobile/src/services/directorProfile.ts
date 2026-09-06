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

export interface SchoolGroupEstablishment {
  id: number;
  director_id: number;
  school_name: string;
  logo: string | null;
  student_count: number;
  pending_join_requests: number;
}

export interface SchoolGroup {
  id: number;
  name: string;
  created_by: number;
  established_by: string;
  establishments: SchoolGroupEstablishment[];
  created_at: string;
}

export type SchoolGroupInvitationStatus = "pending" | "accepted" | "rejected";

export interface SchoolGroupInvitation {
  id: number;
  group: number;
  group_name: string;
  invited_director: number;
  invited_director_name: string;
  status: SchoolGroupInvitationStatus;
  created_at: string;
  responded_at: string | null;
}

/** Groupe scolaire de l'établissement du directeur connecté — null si son
 * établissement n'appartient à aucun groupe. */
export const fetchMySchoolGroup = () =>
  api.get<SchoolGroup | null>("/auth/school-groups/mine/").then((r) => r.data);

export const createSchoolGroup = (name: string) =>
  api.post<SchoolGroup>("/auth/school-groups/", { name }).then((r) => r.data);

export const inviteToSchoolGroup = (email: string) =>
  api.post<SchoolGroupInvitation>("/auth/school-groups/invite/", { email }).then((r) => r.data);

export const fetchMySchoolGroupInvitations = () =>
  api.get<SchoolGroupInvitation[]>("/auth/school-groups/my-invitations/").then((r) => r.data);

export const respondToSchoolGroupInvitation = (invitationId: number, accept: boolean) =>
  api
    .post<SchoolGroupInvitation>(`/auth/school-groups/invitations/${invitationId}/respond/`, { accept })
    .then((r) => r.data);
