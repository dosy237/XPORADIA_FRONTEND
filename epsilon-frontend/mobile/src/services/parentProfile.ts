import api from "@/services/api";

export interface Child {
  id: number;
  first_name: string;
  class_level: string;
  target_subjects: string[];
}

export interface ParentProfile {
  location: string;
  subscription_active: boolean;
  children: Child[];
}

export type ParentProfileUpdate = Partial<Pick<ParentProfile, "location">>;
export type ChildInput = Omit<Child, "id">;

export const fetchParentProfile = () =>
  api.get<ParentProfile>("/auth/parent-profile/").then((r) => r.data);

export const updateParentProfile = (payload: ParentProfileUpdate) =>
  api.patch<ParentProfile>("/auth/parent-profile/", payload).then((r) => r.data);

export const addChild = (payload: ChildInput) =>
  api.post<Child>("/auth/children/", payload).then((r) => r.data);

export const updateChild = (id: number, payload: Partial<ChildInput>) =>
  api.patch<Child>(`/auth/children/${id}/`, payload).then((r) => r.data);

export const deleteChild = (id: number) => api.delete(`/auth/children/${id}/`);
