import api from "@/services/api";
import type { Paginated } from "@/services/teacherDirectory";

export interface CompanyInternshipOffer {
  id: number;
  title: string;
  domain: string;
  level: string;
  city: string;
  is_premium: boolean;
}

export interface CompanyDirectoryCard {
  id: number;
  company_name: string;
  sector: string;
  address: string;
  is_partner: boolean;
  avatar: string | null;
}

export interface CompanyDirectoryDetail extends CompanyDirectoryCard {
  open_internship_offers: CompanyInternshipOffer[];
  average_rating: number | null;
  review_count: number | null;
}

export const fetchCompanyDirectory = () =>
  api.get<Paginated<CompanyDirectoryCard>>("/auth/companies/").then((r) => r.data.results);

export const fetchCompanyDirectoryDetail = (userId: number) =>
  api.get<CompanyDirectoryDetail>(`/auth/companies/${userId}/`).then((r) => r.data);
