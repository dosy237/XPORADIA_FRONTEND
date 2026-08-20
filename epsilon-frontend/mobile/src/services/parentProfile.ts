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

export interface ChildTeacher {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  role_label: string;
}

export interface ChildClassInfo {
  school_class_name: string | null;
  homeroom_teacher: { first_name: string; last_name: string; avatar: string | null } | null;
  teachers: ChildTeacher[];
}

export const fetchChildClass = (childId: number) =>
  api.get<ChildClassInfo>(`/academics/children/${childId}/class/`).then((r) => r.data);

export interface ChildTimetableSlot {
  id: number;
  subject_name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room: string;
}

export const fetchChildTimetable = (childId: number) =>
  api.get<ChildTimetableSlot[]>(`/academics/children/${childId}/timetable/`).then((r) => r.data);

export const contactChildTeacher = (childId: number, teacherId: number) =>
  api
    .post<{ id: number }>("/messaging/contact-child-teacher/", { child_id: childId, teacher_id: teacherId })
    .then((r) => r.data);

export interface UnclaimedChild {
  id: number;
  first_name: string;
  last_name: string;
  class_level: string;
}

export const searchUnclaimedChild = (childEmail: string) =>
  api
    .get<{ child: UnclaimedChild | null }>("/auth/children/search-unclaimed/", { params: { child_email: childEmail } })
    .then((r) => r.data.child);

export const submitChildClaimRequest = (childId: number) =>
  api.post<{ id: number; status: string }>("/auth/child-claim-requests/", { child_id: childId }).then((r) => r.data);

export interface ChildClaimRequest {
  id: number;
  child: number;
  child_first_name: string;
  child_last_name: string;
  parent_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
}

export const fetchMyChildClaimRequests = () =>
  api.get<ChildClaimRequest[]>("/auth/my-child-claim-requests/").then((r) => r.data);
