import api from "@/services/api";

export interface DelegateBasic {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  track_delegates: DelegateBasic[];
  created_at: string;
}

export interface Track {
  id: number;
  department: Department;
  name: string;
  description: string;
  class_delegates: DelegateBasic[];
  created_at: string;
}

export interface HomeroomTeacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
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

export const fetchDepartment = (departmentId: number) =>
  api.get<Department>(`/academics/departments/${departmentId}/`).then((r) => r.data);

export const createDepartment = (payload: { name: string; description?: string }) =>
  api.post<Department>("/academics/departments/", payload).then((r) => r.data);

export const fetchTracks = (departmentId: number) =>
  api
    .get<Track[]>("/academics/tracks/")
    .then((r) => r.data.filter((t) => t.department.id === departmentId));

export const fetchTrack = (trackId: number) =>
  api.get<Track>(`/academics/tracks/${trackId}/`).then((r) => r.data);

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

export const updateClass = (
  classId: number,
  payload: Partial<{ name: string; school_year: string; homeroom_teacher_email: string; capacity: number }>
) => api.patch<SchoolClass>(`/academics/classes/${classId}/`, payload).then((r) => r.data);

export const fetchMyHomeroomClasses = () =>
  api.get<SchoolClass[]>("/academics/my-classes/").then((r) => r.data);

// Réservé au directeur — utilisé pour choisir la classe cible lors d'un
// passage/redoublement, où seul le directeur a autorité (voir backend).
export const fetchAllMyClasses = () =>
  api.get<SchoolClass[]>("/academics/classes/").then((r) => r.data);

// "letters" | "sciences" | "other" — groupe utilisé pour les sous-totaux
// ("Bilan LETTRES/SCIENCES/AUTRES") du bulletin officiel. Classé par
// l'enseignant titulaire de la classe, au même titre que le reste de la
// gestion des matières (voir SubjectCard dans my-classes/[classId].tsx).
export type SubjectCategory = "letters" | "sciences" | "other";

export interface Subject {
  id: number;
  school_class: SchoolClass;
  name: string;
  category: SubjectCategory;
  category_label: string;
  teacher: HomeroomTeacher | null;
  pending_invitation_email: string | null;
  pending_invitation_token: string | null;
  created_at: string;
}

export const fetchSubjects = (classId: number) =>
  api.get<Subject[]>(`/academics/classes/${classId}/subjects/`).then((r) => r.data);

export const createSubject = (classId: number, payload: { name: string; teacher_email?: string }) =>
  api.post<Subject>(`/academics/classes/${classId}/subjects/`, payload).then((r) => r.data);

export const updateSubjectTeacher = (subjectId: number, teacherEmail: string | null) =>
  api
    .patch<Subject>(`/academics/subjects/${subjectId}/`, { teacher_email: teacherEmail })
    .then((r) => r.data);

export const updateSubjectCategory = (subjectId: number, category: SubjectCategory) =>
  api.patch<Subject>(`/academics/subjects/${subjectId}/`, { category }).then((r) => r.data);

export const deleteSubject = (subjectId: number) => api.delete(`/academics/subjects/${subjectId}/`);

export const fetchMyDedicatedSubjects = () =>
  api.get<Subject[]>("/academics/my-subjects/").then((r) => r.data);

export interface TeacherInvitationPreview {
  token: string;
  email: string;
  subject_name: string;
  school_class_name: string;
  school_name: string;
  invited_by_name: string;
  created_at: string;
}

export const fetchInvitationPreview = (token: string) =>
  api.get<TeacherInvitationPreview>(`/academics/invitations/${token}/`).then((r) => r.data);

export const acceptInvitation = (token: string) =>
  api.post<Subject>(`/academics/invitations/${token}/accept/`).then((r) => r.data);

export interface ChildBasic {
  id: number;
  first_name: string;
  class_level: string;
}

export const lookupChildrenByParentEmail = (parentEmail: string) =>
  api
    .get<ChildBasic[]>("/academics/children-lookup/", { params: { parent_email: parentEmail } })
    .then((r) => r.data);

export type EnrollmentStatus = "active" | "promoted" | "repeating" | "withdrawn";

export interface Enrollment {
  id: number;
  child: ChildBasic;
  school_class: SchoolClass;
  status: EnrollmentStatus;
  enrolled_at: string;
  ended_at: string | null;
}

export const fetchClassRoster = (classId: number) =>
  api.get<Enrollment[]>(`/academics/classes/${classId}/roster/`).then((r) => r.data);

export const enrollChild = (classId: number, childId: number) =>
  api.post<Enrollment>(`/academics/classes/${classId}/roster/`, { child_id: childId }).then((r) => r.data);

export const transitionEnrollment = (
  enrollmentId: number,
  payload: { status: "promoted" | "repeating" | "withdrawn"; target_class_id?: number }
) =>
  api
    .post<{ closed: Enrollment; new_enrollment: Enrollment | null }>(
      `/academics/roster/${enrollmentId}/transition/`,
      payload
    )
    .then((r) => r.data);

export interface BatchTransitionEntry {
  child_id: number;
  status: "promoted" | "repeating" | "withdrawn";
  target_class_id?: number;
}

export interface BatchTransitionResult {
  processed: number;
  failed: number;
  results: { child_id: number; success: boolean; error?: string }[];
}

export const batchTransitionRoster = (
  classId: number,
  payload: { default_target_class_id?: number; entries: BatchTransitionEntry[] }
) =>
  api
    .post<BatchTransitionResult>(`/academics/classes/${classId}/batch-transition/`, payload)
    .then((r) => r.data);

export interface YearEndClassStatus {
  school_class: number;
  name: string;
  school_year: string;
  homeroom_teacher: string | null;
  students_remaining: number;
  is_complete: boolean;
}

export const fetchYearEndReadiness = () =>
  api.get<YearEndClassStatus[]>("/academics/year-end-readiness/").then((r) => r.data);

export interface LevelMismatch {
  enrollment: number;
  child: number;
  first_name: string;
  last_name: string;
  declared_level: string;
  current_class: string;
  current_class_id: number;
}

export const fetchStartOfYearCheck = () =>
  api
    .get<{ total_checked: number; mismatches_found: number; mismatches: LevelMismatch[] }>(
      "/academics/start-of-year-check/"
    )
    .then((r) => r.data);

export const correctEnrollmentClass = (enrollmentId: number, schoolClassId: number) =>
  api
    .post<Enrollment>(`/academics/roster/${enrollmentId}/correct-class/`, { school_class_id: schoolClassId })
    .then((r) => r.data);

export interface TimetableSlot {
  id: number;
  school_class: number;
  subject: number;
  subject_name: string;
  weekday: number;
  weekday_label: string;
  start_time: string;
  end_time: string;
  room: string;
}

export const fetchTimetable = (classId: number) =>
  api.get<TimetableSlot[]>(`/academics/classes/${classId}/timetable/`).then((r) => r.data);

export const createTimetableSlot = (
  classId: number,
  payload: { subject: number; weekday: number; start_time: string; end_time: string; room?: string },
) => api.post<TimetableSlot>(`/academics/classes/${classId}/timetable/`, payload).then((r) => r.data);

export const deleteTimetableSlot = (slotId: number) =>
  api.delete(`/academics/timetable-slots/${slotId}/`);

/** Équivalents "résolus automatiquement" pour l'élève connecté — pas
 * besoin de connaître son classId côté frontend. */
export const fetchMyTimetable = () =>
  api.get<TimetableSlot[]>("/academics/my-timetable/").then((r) => r.data);

export interface AgendaPersonalBlock {
  block: number;
  exception: number | null;
  title: string;
  subject: number | null;
  subject_name: string | null;
  start_time: string;
  end_time: string;
}

export type EventType = "report_card_distribution" | "meeting" | "holiday" | "cancelled_class" | "other";
export type EventAudience = "students" | "parents" | "teachers";

export interface EstablishmentEvent {
  id: number;
  school_class: number | null;
  event_type: EventType;
  event_type_label: string;
  title: string;
  description: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  audience: EventAudience[];
  created_at: string;
}

export interface AgendaDay {
  date: string;
  weekday: number;
  is_school_day: boolean;
  term: { id: number; number: number; name: string } | null;
  official_slots: TimetableSlot[];
  personal_blocks: AgendaPersonalBlock[];
  school_events: EstablishmentEvent[];
}

/** Agenda du jour pour l'élève connecté : cours officiels (lecture seule,
 * vides en vacances) + créneaux personnels, toujours affichés. */
export const fetchMyAgenda = (date: string) =>
  api.get<AgendaDay>(`/academics/my-agenda/?date=${date}`).then((r) => r.data);

export interface TeacherTimetableSlot extends TimetableSlot {
  school_class_name: string;
}

export interface TeacherAgendaDay {
  date: string;
  weekday: number;
  is_school_day: boolean;
  official_slots: TeacherTimetableSlot[];
}

/** Agenda du jour pour l'enseignant connecté, agrégeant TOUTES ses classes
 * (celles où il est enseignant dédié d'une matière) — jamais une classe à
 * la fois, contrairement à fetchTimetable. */
export const fetchMyTeacherAgenda = (date: string) =>
  api.get<TeacherAgendaDay>(`/academics/my-teacher-agenda/?date=${date}`).then((r) => r.data);

export type AttendanceStatus = "absent" | "late" | "excused";

export interface AttendanceRosterEntry {
  child: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  status: AttendanceStatus | null;
  reason: string;
}

export interface SlotAttendance {
  date: string;
  taken: boolean;
  taken_by: string | null;
  taken_at: string | null;
  cancelled: boolean;
  cancelled_reason: string;
  roster: AttendanceRosterEntry[];
}

export interface AttendanceExceptionInput {
  child: number;
  status: AttendanceStatus;
  reason?: string;
}

/** L'appel d'un créneau précis à une date précise — tous les élèves
 * inscrits présents par défaut, seules les exceptions sont envoyées. */
export const fetchSlotAttendance = (slotId: number, date: string) =>
  api.get<SlotAttendance>(`/academics/timetable-slots/${slotId}/attendance/?date=${date}`).then((r) => r.data);

/** Enregistre l'appel complet en un seul envoi — la liste `exceptions`
 * remplace systématiquement celle déjà enregistrée (jamais un delta). */
export const saveSlotAttendance = (slotId: number, date: string, exceptions: AttendanceExceptionInput[]) =>
  api
    .post<SlotAttendance>(`/academics/timetable-slots/${slotId}/attendance/`, { date, exceptions })
    .then((r) => r.data);

export interface TeacherAttendanceSlot extends TeacherTimetableSlot {
  attendance_taken: boolean;
  attendance_exceptions_count: number;
  cancelled: boolean;
}

/** Déclare qu'un créneau précis ne sera pas tenu à cette date — notifie
 * titulaire, directeur, élèves et parents, et empêche toute déclaration
 * d'heures travaillées ce jour-là (voir apps.employment.views côté
 * backend). Réservé à l'enseignant dédié de la matière du créneau. */
export const declareTeacherAbsence = (slotId: number, date: string, reason: string) =>
  api
    .post<{ id: number; date: string; reason: string }>(`/academics/timetable-slots/${slotId}/absence/`, {
      date,
      reason,
    })
    .then((r) => r.data);

/** Annule une déclaration d'absence : l'enseignant peut finalement
 * assurer le cours. */
export const revokeTeacherAbsence = (slotId: number, date: string) =>
  api.delete(`/academics/timetable-slots/${slotId}/absence/?date=${date}`);

export interface TeacherAttendanceOverview {
  date: string;
  weekday: number;
  is_school_day: boolean;
  slots: TeacherAttendanceSlot[];
}

/** Créneaux du jour pour l'enseignant connecté, chacun annoté de l'état
 * de son appel — pour repérer d'un coup d'œil ce qui reste à faire. */
export const fetchMyAttendanceOverview = (date: string) =>
  api.get<TeacherAttendanceOverview>(`/academics/my-attendance-overview/?date=${date}`).then((r) => r.data);

export interface PersonalScheduleBlock {
  id: number;
  weekday: number;
  weekday_label: string;
  start_time: string;
  end_time: string;
  title: string;
  subject: number | null;
  subject_name: string | null;
  valid_from: string;
  valid_until: string | null;
}

export const createPersonalBlock = (payload: {
  weekday: number;
  start_time: string;
  end_time: string;
  title: string;
  subject?: number;
  valid_from: string;
  valid_until?: string;
}) => api.post<PersonalScheduleBlock>("/academics/personal-blocks/", payload).then((r) => r.data);

export type OccurrenceScope = "this" | "following";

/** Modifie une occurrence d'un créneau personnel — `scope` doit toujours
 * être fourni explicitement par l'appelant (jamais de valeur par défaut
 * assumée côté service). "this" crée une exception ponctuelle pour cette
 * date ; "following" clôt la règle actuelle et en ouvre une nouvelle à
 * partir de cette date. */
export const editPersonalBlockOccurrence = (
  blockId: number,
  payload: {
    scope: OccurrenceScope;
    date: string;
    title?: string;
    subject?: number;
    start_time?: string;
    end_time?: string;
  }
) => api.patch(`/academics/personal-blocks/${blockId}/occurrence/`, payload).then((r) => r.data);

export const deletePersonalBlockOccurrence = (blockId: number, scope: OccurrenceScope, date: string) =>
  api.delete(`/academics/personal-blocks/${blockId}/occurrence/`, { params: { scope, date } });

/** Événements d'établissement (remise de bulletins, réunion, jour férié,
 * autre) de cette classe, plus ceux déclarés pour tout l'établissement. */
export const fetchClassEvents = (classId: number) =>
  api.get<EstablishmentEvent[]>(`/academics/classes/${classId}/events/`).then((r) => r.data);

export const createClassEvent = (
  classId: number,
  payload: {
    event_type: EventType;
    title: string;
    description?: string;
    date: string;
    start_time?: string;
    end_time?: string;
    audience: EventAudience[];
    for_whole_establishment?: boolean;
  }
) => api.post<EstablishmentEvent>(`/academics/classes/${classId}/events/`, payload).then((r) => r.data);

export interface MyClassmate {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  /** Faux si l'élève n'a pas encore activé son compte : pas de conversation possible tant que c'est le cas. */
  can_message: boolean;
}

export interface MyClassSubject {
  id: number;
  name: string;
  teacher_name: string | null;
  /** Canal de matière déjà créé par l'enseignant dédié, ou null s'il ne l'a pas encore créé. */
  channel_id: number | null;
}

export interface MyClass {
  school_class_name: string | null;
  homeroom_teacher: { first_name: string; last_name: string; avatar: string | null } | null;
  classmates: MyClassmate[];
  subjects: MyClassSubject[];
  establishment_name: string | null;
  class_level: string;
  status: EnrollmentStatus | null;
  birth_date: string | null;
}

export const fetchMyClass = () => api.get<MyClass>("/academics/my-class/").then((r) => r.data);

export const addDepartmentDelegate = (departmentId: number, email: string) =>
  api.post<Department>(`/academics/departments/${departmentId}/delegates/`, { email }).then((r) => r.data);

export const removeDepartmentDelegate = (departmentId: number, email: string) =>
  api
    .delete<Department>(`/academics/departments/${departmentId}/delegates/`, { data: { email } })
    .then((r) => r.data);

export const addTrackDelegate = (trackId: number, email: string) =>
  api.post<Track>(`/academics/tracks/${trackId}/delegates/`, { email }).then((r) => r.data);

export const removeTrackDelegate = (trackId: number, email: string) =>
  api.delete<Track>(`/academics/tracks/${trackId}/delegates/`, { data: { email } }).then((r) => r.data);

export type DelegatedTask = "timetable" | "join_requests";

export interface TaskDelegationInfo {
  task: DelegatedTask;
  task_label: string;
  establishment_name: string;
}

export interface MyDelegations {
  departments_for_tracks: Department[];
  tracks_for_classes: Track[];
  tasks: TaskDelegationInfo[];
}

export const fetchMyDelegations = () =>
  api.get<MyDelegations>("/academics/my-delegations/").then((r) => r.data);

export const fetchMyTimetableDelegationClasses = () =>
  api.get<SchoolClass[]>("/academics/my-timetable-delegation-classes/").then((r) => r.data);

export interface TaskDelegationEntry {
  id: number;
  task: DelegatedTask;
  task_label: string;
  teacher: { id: number; first_name: string; last_name: string; email: string; avatar: string | null };
}

export const TASK_LABELS: Record<DelegatedTask, string> = {
  timetable: "Gestion des emplois du temps",
  join_requests: "Gestion des demandes de rattachement",
};

export const fetchTaskDelegations = () =>
  api.get<TaskDelegationEntry[]>("/academics/task-delegations/").then((r) => r.data);

export const addTaskDelegation = (task: DelegatedTask, email: string) =>
  api.post<{ id: number; task: DelegatedTask }>("/academics/task-delegations/", { task, email }).then((r) => r.data);

export const removeTaskDelegation = (task: DelegatedTask, email: string) =>
  api.delete("/academics/task-delegations/", { data: { task, email } });

export const removeFromEstablishment = (childId: number) =>
  api.post(`/academics/children/${childId}/remove-from-establishment/`);
