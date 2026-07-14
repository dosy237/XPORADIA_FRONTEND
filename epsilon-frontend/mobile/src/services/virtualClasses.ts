import api from "@/services/api";

export type ExerciseStatus = "draft" | "published" | "closed";

export interface Exercise {
  id: string;
  title: string;
  instructions: string;
  attachments: string[];
  deadline: string | null;
  status: ExerciseStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VirtualClass {
  id: string;
  subject: number;
  subject_name: string;
  school_class_name: string;
  description: string;
  is_active: boolean;
  exercise_count: number;
  created_at: string;
  updated_at: string;
}

export const fetchSubjectVirtualClass = (subjectId: number) =>
  api.get<VirtualClass>(`/virtual-classes/subjects/${subjectId}/`).then((r) => r.data);

export const updateVirtualClassDescription = (subjectId: number, description: string) =>
  api
    .patch<VirtualClass>(`/virtual-classes/subjects/${subjectId}/`, { description })
    .then((r) => r.data);

export const fetchExercises = (subjectId: number) =>
  api.get<Exercise[]>(`/virtual-classes/subjects/${subjectId}/exercises/`).then((r) => r.data);

export const createExercise = (
  subjectId: number,
  payload: { title: string; instructions: string; status?: ExerciseStatus; deadline?: string }
) => api.post<Exercise>(`/virtual-classes/subjects/${subjectId}/exercises/`, payload).then((r) => r.data);

export const updateExercise = (exerciseId: string, payload: Partial<{ status: ExerciseStatus }>) =>
  api.patch<Exercise>(`/virtual-classes/exercises/${exerciseId}/`, payload).then((r) => r.data);

export const deleteExercise = (exerciseId: string) =>
  api.delete(`/virtual-classes/exercises/${exerciseId}/`);
