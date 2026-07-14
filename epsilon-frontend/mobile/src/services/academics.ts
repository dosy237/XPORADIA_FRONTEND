import api from "@/services/api";

export interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Track {
  id: number;
  department: Department;
  name: string;
  description: string;
  created_at: string;
}

export interface HomeroomTeacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface SchoolClass {
  id: number;
  track: Track;
  name: string;
  school_year: string;
  homeroom_teacher: HomeroomTeacher | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
}

export const fetchDepartments = () =>
  api.get<Department[]>("/academics/departments/").then((r) => r.data);

export const createDepartment = (payload: { name: string; description?: string }) =>
  api.post<Department>("/academics/departments/", payload).then((r) => r.data);

export const fetchTracks = (departmentId: number) =>
  api
    .get<Track[]>("/academics/tracks/")
    .then((r) => r.data.filter((t) => t.department.id === departmentId));

export const createTrack = (payload: { department_id: number; name: string; description?: string }) =>
  api.post<Track>("/academics/tracks/", payload).then((r) => r.data);

export const fetchClasses = (trackId: number) =>
  api.get<SchoolClass[]>("/academics/classes/").then((r) => r.data.filter((c) => c.track.id === trackId));

export const createClass = (payload: {
  track_id: number;
  name: string;
  school_year: string;
  homeroom_teacher_email?: string;
  capacity?: number;
}) => api.post<SchoolClass>("/academics/classes/", payload).then((r) => r.data);

export const fetchMyHomeroomClasses = () =>
  api.get<SchoolClass[]>("/academics/my-classes/").then((r) => r.data);
