import api from "@/services/api";

export interface PersonalNote {
  id: number;
  subject: number | null;
  subject_name: string | null;
  title: string;
  content: string;
  attachments: { name: string; url: string; type: string }[];
  created_at: string;
  updated_at: string;
}

export interface PersonalDocument {
  id: number;
  name: string;
  file: string;
  uploaded_at: string;
}

export interface LifeGoal {
  description: string;
  related_subjects: string[];
  updated_at: string;
}

export interface BucketListItem {
  id: number;
  title: string;
  description: string;
  is_done: boolean;
  due_date: string | null;
  created_at: string;
  done_at: string | null;
}

export const fetchNotes = () => api.get<PersonalNote[]>("/student-life/notes/").then((r) => r.data);
export const createNote = (payload: { title: string; content?: string; subject?: number }) =>
  api.post<PersonalNote>("/student-life/notes/", payload).then((r) => r.data);
export const updateNote = (id: number, payload: Partial<{ title: string; content: string }>) =>
  api.patch<PersonalNote>(`/student-life/notes/${id}/`, payload).then((r) => r.data);
export const deleteNote = (id: number) => api.delete(`/student-life/notes/${id}/`);

export const fetchDocuments = () =>
  api.get<PersonalDocument[]>("/student-life/documents/").then((r) => r.data);
export const deleteDocument = (id: number) => api.delete(`/student-life/documents/${id}/`);

/** Upload multipart — pattern réutilisable partout ailleurs où
 * PersonalDocument/Exercise/Submission attendent un vrai fichier plutôt
 * qu'une URL (le reste de l'app n'a, à ce jour, aucun upload de fichier
 * réel : c'est le premier). */
export const uploadDocument = (name: string, file: { uri: string; name: string; mimeType?: string | null }) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? "application/pdf",
  } as unknown as Blob);
  return api
    .post<PersonalDocument>("/student-life/documents/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const fetchLifeGoal = () => api.get<LifeGoal>("/student-life/life-goal/").then((r) => r.data);
export const updateLifeGoal = (payload: Partial<LifeGoal>) =>
  api.put<LifeGoal>("/student-life/life-goal/", payload).then((r) => r.data);

export const fetchBucketList = () =>
  api.get<BucketListItem[]>("/student-life/bucket-list/").then((r) => r.data);
export const createBucketListItem = (payload: { title: string; description?: string; due_date?: string }) =>
  api.post<BucketListItem>("/student-life/bucket-list/", payload).then((r) => r.data);
export const toggleBucketListItem = (id: number, is_done: boolean) =>
  api.patch<BucketListItem>(`/student-life/bucket-list/${id}/`, { is_done }).then((r) => r.data);
export const deleteBucketListItem = (id: number) => api.delete(`/student-life/bucket-list/${id}/`);
