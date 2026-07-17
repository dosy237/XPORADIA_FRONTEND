import api from "@/services/api";

export interface TeacherProfile {
  subjects: string[];
  experience_years: number;
  hourly_rate: string | null;
  location: string;
  bio: string;
  available_for_tutoring: boolean;
  available_for_employment: boolean;
  is_documents_validated: boolean;
  preregistration_code_submitted: boolean;
}

export type TeacherProfileUpdate = Partial<
  Omit<TeacherProfile, "is_documents_validated" | "preregistration_code_submitted">
>;

export const fetchTeacherProfile = () =>
  api.get<TeacherProfile>("/auth/teacher-profile/").then((r) => r.data);

export const updateTeacherProfile = (payload: TeacherProfileUpdate) =>
  api.patch<TeacherProfile>("/auth/teacher-profile/", payload).then((r) => r.data);
