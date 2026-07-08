import api from "@/services/api";

export interface TeacherProfile {
  subjects: string[];
  experience_years: number;
  hourly_rate: string | null;
  location: string;
  bio: string;
  available_for_tutoring: boolean;
  available_for_employment: boolean;
}

export type TeacherProfileUpdate = Partial<TeacherProfile>;

export const fetchTeacherProfile = () =>
  api.get<TeacherProfile>("/auth/teacher-profile/").then((r) => r.data);

export const updateTeacherProfile = (payload: TeacherProfileUpdate) =>
  api.patch<TeacherProfile>("/auth/teacher-profile/", payload).then((r) => r.data);
