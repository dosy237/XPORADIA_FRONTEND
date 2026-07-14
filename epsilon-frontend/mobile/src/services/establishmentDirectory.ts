import api from "@/services/api";
import type { Paginated } from "@/services/teacherDirectory";

export interface EstablishmentDepartment {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface EstablishmentDirectoryCard {
  id: number;
  school_name: string;
  address: string;
  levels_taught: string[];
  student_count: number;
  is_partner: boolean;
  avatar: string | null;
}

export interface EstablishmentDirectoryDetail extends EstablishmentDirectoryCard {
  departments: EstablishmentDepartment[];
}

export const fetchEstablishmentDirectory = () =>
  api
    .get<Paginated<EstablishmentDirectoryCard>>("/auth/establishments/")
    .then((r) => r.data.results);

export const fetchEstablishmentDirectoryDetail = (userId: number) =>
  api.get<EstablishmentDirectoryDetail>(`/auth/establishments/${userId}/`).then((r) => r.data);
