import { appendFileAsset } from "@/lib/formDataAsset";
import api from "@/services/api";

export type ResourceType = "course" | "revision" | "exercise" | "solution" | "exam";
export type SchoolLevel = "6e" | "5e" | "4e" | "3e" | "2nde" | "1ere" | "tle";
export type ResourceCategory =
  | "academic"
  | "literature"
  | "society"
  | "science"
  | "biography"
  | "arts"
  | "environment";

export interface LibraryResource {
  id: string;
  title: string;
  description: string;
  resource_type: ResourceType;
  category: ResourceCategory;
  level: SchoolLevel;
  subject: string;
  cover_image: string | null;
  file_url: string;
  pdf_file: string | null;
  file_size_kb: number;
  tags: string[];
  author_name: string;
  is_contributed: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  download_count: number;
  avg_rating: string;
  ratings_count: number;
  /** Note (1 à 5) déjà donnée par l'utilisateur connecté à cette
   * ressource, ou null s'il ne l'a pas encore notée. */
  my_rating: number | null;
  is_archived: boolean;
  is_favorited: boolean;
  can_manage: boolean;
  created_at: string;
}

export interface LibraryEstablishment {
  id: number;
  school_name: string;
}

export const fetchMyLibraryEstablishments = () =>
  api.get<LibraryEstablishment[]>("/library/my-establishments/").then((r) => r.data);

export const fetchLibraryResources = (
  establishmentId: number,
  filters?: { subject?: string; level?: SchoolLevel; resource_type?: ResourceType }
) =>
  api
    .get<LibraryResource[]>(`/library/establishments/${establishmentId}/resources/`, { params: filters })
    .then((r) => r.data);

export const fetchLibraryResource = (resourceId: string) =>
  api.get<LibraryResource>(`/library/resources/${resourceId}/`).then((r) => r.data);

export interface CreateLibraryResourcePayload {
  title: string;
  description?: string;
  resource_type: ResourceType;
  category: ResourceCategory;
  level: SchoolLevel;
  subject: string;
  /** Choix exclusif, voir le formulaire : soit un PDF à héberger, soit un
   * lien externe — jamais les deux à la fois. */
  file_url?: string;
  pdfFile?: { uri: string; name: string; mimeType?: string | null };
  coverImage?: { uri: string; name: string; mimeType?: string | null };
}

async function buildResourceFormData(payload: CreateLibraryResourcePayload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  formData.append("resource_type", payload.resource_type);
  formData.append("category", payload.category);
  formData.append("level", payload.level);
  formData.append("subject", payload.subject);
  if (payload.file_url) formData.append("file_url", payload.file_url);
  if (payload.pdfFile) {
    await appendFileAsset(formData, "pdf_file", {
      uri: payload.pdfFile.uri,
      name: payload.pdfFile.name,
      mimeType: payload.pdfFile.mimeType ?? "application/pdf",
    });
  }
  if (payload.coverImage) {
    await appendFileAsset(formData, "cover_image", {
      uri: payload.coverImage.uri,
      name: payload.coverImage.name,
      mimeType: payload.coverImage.mimeType ?? "image/jpeg",
    });
  }
  return formData;
}

export const createLibraryResource = async (establishmentId: number, payload: CreateLibraryResourcePayload) =>
  api
    .post<LibraryResource>(
      `/library/establishments/${establishmentId}/resources/`,
      await buildResourceFormData(payload),
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    .then((r) => r.data);

export const archiveLibraryResource = (resourceId: string) =>
  api
    .patch<LibraryResource>(`/library/resources/${resourceId}/`, { is_archived: true })
    .then((r) => r.data);

export const trackLibraryResourceDownload = (resourceId: string) =>
  api.post<{ download_count: number }>(`/library/resources/${resourceId}/download/`).then((r) => r.data);

export const favoriteLibraryResource = (resourceId: string) =>
  api.post(`/library/resources/${resourceId}/favorite/`);

export const unfavoriteLibraryResource = (resourceId: string) =>
  api.delete(`/library/resources/${resourceId}/favorite/`);

export const fetchMyLibraryFavorites = () =>
  api.get<LibraryResource[]>("/library/my-favorites/").then((r) => r.data);

export const rateLibraryResource = (resourceId: string, score: number) =>
  api
    .post<{ id: number; score: number }>(`/library/resources/${resourceId}/rate/`, { score })
    .then((r) => r.data);
