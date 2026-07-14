import api from "@/services/api";

export type CertificationLevel = "bronze" | "silver" | "gold";
export type ModuleCategory = "pedagogy" | "didactics" | "management" | "ethics" | "leadership";

export interface TrainingModule {
  id: string;
  title: string;
  category: ModuleCategory;
  description: string;
  objectives: string[];
  prerequisites: string;
  duration_hours: number;
  price: number;
  target_level: CertificationLevel;
}

export interface TrainingSession {
  id: string;
  module: TrainingModule;
  trainer: number;
  city: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  enrolled_count: number;
  places_left: number;
  is_full: boolean;
  status: string;
}

export interface Certification {
  id: string;
  module: TrainingModule;
  level: CertificationLevel;
  score_total: string;
  qr_code: string;
  pdf_url: string;
  issued_at: string;
  expires_at: string;
  is_valid: boolean;
}

export interface MyCertificationStatus {
  current_level: CertificationLevel | null;
  next_level: CertificationLevel | null;
  levels_achieved: CertificationLevel[];
  certifications: Certification[];
}

export const fetchMyCertificationStatus = () =>
  api.get<MyCertificationStatus>("/certification/my-status/").then((r) => r.data);

export const fetchTrainingModules = (params?: { category?: string; target_level?: string }) =>
  api.get<TrainingModule[]>("/certification/modules/", { params }).then((r) => r.data);

export const fetchTrainingSessions = (params?: { module?: string; city?: string }) =>
  api.get<TrainingSession[]>("/certification/sessions/", { params }).then((r) => r.data);
