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
  has_online_exam: boolean;
}

export type ExamQuestionType = "mcq" | "open" | "tf";

export interface ExamQuestion {
  id: string;
  question_type: ExamQuestionType;
  text: string;
  options: string[];
  points: number;
}

export interface ExamAttemptResult {
  id: string;
  module: TrainingModule;
  score_total: string;
  status: string;
  submitted_at: string;
  leveled_up: boolean;
  new_level: CertificationLevel | null;
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

export const fetchTrainingModule = (id: string) =>
  api.get<TrainingModule>(`/certification/modules/${id}/`).then((r) => r.data);

export const fetchTrainingSessions = (params?: { module?: string; city?: string }) =>
  api.get<TrainingSession[]>("/certification/sessions/", { params }).then((r) => r.data);

export const fetchOnlineExamQuestions = (moduleId: string) =>
  api.get<ExamQuestion[]>(`/certification/modules/${moduleId}/online-exam/`).then((r) => r.data);

export const submitOnlineExam = (moduleId: string, answers: Record<string, string>) =>
  api
    .post<ExamAttemptResult>(`/certification/modules/${moduleId}/online-exam/submit/`, { answers })
    .then((r) => r.data);

export type MobileOperator = "orange" | "wave" | "mtn";

export interface TrainingPayment {
  id: string;
  amount: number;
  status: string;
  operator: MobileOperator;
  tx_ref: string;
}

export interface SessionEnrollment {
  id: number;
  session: TrainingSession;
  payment_status: "pending" | "paid" | "refunded";
  attendance_score: number | null;
  payment: TrainingPayment | null;
  enrolled_at: string;
}

export const fetchMySessionEnrollments = () =>
  api.get<SessionEnrollment[]>("/certification/my-enrollments/").then((r) => r.data);

export const enrollInSession = (
  sessionId: string,
  payload: { operator: MobileOperator; phone_number: string }
) =>
  api
    .post<SessionEnrollment>(`/certification/sessions/${sessionId}/enroll/`, payload)
    .then((r) => r.data);
