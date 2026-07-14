import api from "@/services/api";

export interface TeacherComment {
  id: number;
  body: string;
  is_anonymous: boolean;
  author_name: string;
  created_at: string;
}

export const fetchTeacherComments = (userId: number) =>
  api.get<TeacherComment[]>(`/auth/teachers/${userId}/comments/`).then((r) => r.data);

export const postTeacherComment = (userId: number, body: string, isAnonymous: boolean) =>
  api
    .post<TeacherComment>(`/auth/teachers/${userId}/comments/`, {
      body,
      is_anonymous: isAnonymous,
    })
    .then((r) => r.data);
