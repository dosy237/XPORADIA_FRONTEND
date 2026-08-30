import api from "@/services/api";
import type { Certification, CertificationLevel } from "@/services/certification";

export interface TeacherDirectoryCard {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  subjects: string[];
  experience_years: number;
  location: string;
  available_for_tutoring: boolean;
  available_for_employment: boolean;
  current_level: CertificationLevel | null;
  total_points: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  posts_count: number;
  // Uniquement révélé quand l'appelant est un parent — voir
  // TeacherTutoringCardSerializer côté backend.
  hourly_rate?: string;
}

export interface EmploymentHistoryEntry {
  id: string;
  school_name: string;
  contract_type: "cdi" | "cdd" | "vacation" | "interim";
  confirmed_at: string;
}

export interface TeacherDirectoryDetail extends TeacherDirectoryCard {
  bio: string;
  certifications: Certification[];
  // Absent (pas seulement vide) quand l'appelant est un parent — voir
  // TeacherTutoringDetailSerializer côté backend, qui ne déclare pas ce
  // champ du tout.
  employment_history?: EmploymentHistoryEntry[];
  profile_visible?: boolean | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const fetchTeacherDirectory = (params?: {
  subject?: string;
  available_for_tutoring?: "true";
  location?: string;
}) =>
  api
    .get<Paginated<TeacherDirectoryCard>>("/auth/teachers/", { params })
    .then((r) => r.data.results);

export const fetchTeacherDirectoryDetail = (userId: number) =>
  api.get<TeacherDirectoryDetail>(`/auth/teachers/${userId}/`).then((r) => r.data);
