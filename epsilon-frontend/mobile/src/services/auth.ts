import api from "@/services/api";
import type { User } from "@/types/user";

export interface RegisterResponse {
  user: User;
  detail: string;
}

export interface LoginResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface TeacherRegisterPayload {
  email: string;
  phone?: string;
  password: string;
  first_name: string;
  last_name: string;
  subjects?: string[];
  experience_years?: number;
  location?: string;
}

export interface DirectorRegisterPayload {
  email: string;
  phone?: string;
  password: string;
  first_name: string;
  last_name: string;
  school_name: string;
  address: string;
  levels_taught?: string[];
  student_count?: number;
}

export interface ChildPayload {
  first_name: string;
  class_level: string;
  target_subjects?: string[];
}

export interface ParentRegisterPayload {
  email: string;
  phone?: string;
  password: string;
  first_name: string;
  last_name: string;
  location?: string;
  children?: ChildPayload[];
}

export const registerTeacher = (payload: TeacherRegisterPayload) =>
  api.post<RegisterResponse>("/auth/register/teacher/", payload).then((r) => r.data);

export const registerDirector = (payload: DirectorRegisterPayload) =>
  api.post<RegisterResponse>("/auth/register/director/", payload).then((r) => r.data);

export const registerParent = (payload: ParentRegisterPayload) =>
  api.post<RegisterResponse>("/auth/register/parent/", payload).then((r) => r.data);

export const login = (email: string, password: string) =>
  api.post<LoginResponse>("/auth/token/", { email, password }).then((r) => r.data);

export const fetchMe = () => api.get<User>("/auth/me/").then((r) => r.data);

export const verifyOtp = (code: string) =>
  api.post<{ detail: string; user: User }>("/auth/otp/verify/", { code }).then((r) => r.data);

export const resendOtp = () =>
  api.post<{ detail: string }>("/auth/otp/resend/").then((r) => r.data);
