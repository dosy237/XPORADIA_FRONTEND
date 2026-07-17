import api from "@/services/api";

export type ResourceType = "course" | "revision" | "exercise" | "solution" | "exam";
export type SchoolLevel = "6e" | "5e" | "4e" | "3e" | "2nde" | "1ere" | "tle";

export interface LibraryResource {
  id: string;
  title: string;
  description: string;
  resource_type: ResourceType;
  level: SchoolLevel;
  subject: string;
  file_url: string;
  file_size_kb: number;
  tags: string[];
  author_name: string;
  is_contributed: boolean;
  download_count: number;
  avg_rating: string;
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

export const createLibraryResource = (
  establishmentId: number,
  payload: {
    title: string;
    description?: string;
    resource_type: ResourceType;
    level: SchoolLevel;
    subject: string;
    file_url: string;
  }
) =>
  api
    .post<LibraryResource>(`/library/establishments/${establishmentId}/resources/`, payload)
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
