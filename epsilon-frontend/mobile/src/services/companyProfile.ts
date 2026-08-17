import api from "@/services/api";

export interface CompanyProfile {
  company_name: string;
  sector: string;
  address: string;
  is_partner: boolean;
  brand_primary_color: string;
  brand_secondary_color: string;
}

export type CompanyProfileUpdate = Partial<Omit<CompanyProfile, "is_partner">>;

export const fetchCompanyProfile = () =>
  api.get<CompanyProfile>("/auth/company-profile/").then((r) => r.data);

export const updateCompanyProfile = (payload: CompanyProfileUpdate) =>
  api.patch<CompanyProfile>("/auth/company-profile/", payload).then((r) => r.data);
