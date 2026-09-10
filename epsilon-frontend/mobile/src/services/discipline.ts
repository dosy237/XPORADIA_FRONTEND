import api from "@/services/api";

export type IncidentSeverity = "minor" | "moderate" | "serious";
export type IncidentSanction = "none" | "warning" | "reprimand" | "detention" | "suspension";

export interface DisciplinaryIncident {
  id: number;
  child: number;
  child_name: string;
  school_class: number;
  class_name: string;
  occurred_on: string;
  description: string;
  severity: IncidentSeverity;
  severity_label: string;
  sanction: IncidentSanction;
  sanction_label: string;
  recorded_by_name: string;
  parent_notified_at: string | null;
  created_at: string;
}

export interface IncidentsDashboard {
  total: number;
  by_severity: Record<IncidentSeverity, number>;
  recent: DisciplinaryIncident[];
}

export const fetchChildIncidents = (childId: number) =>
  api.get<DisciplinaryIncident[]>(`/discipline/incidents/?child_id=${childId}`).then((r) => r.data);

export const recordIncident = (
  childId: number,
  data: { occurred_on: string; description: string; severity: IncidentSeverity; sanction: IncidentSanction }
) =>
  api
    .post<DisciplinaryIncident>("/discipline/incidents/", { child_id: childId, ...data })
    .then((r) => r.data);

export const notifyParentAboutIncident = (incidentId: number) =>
  api.post<DisciplinaryIncident>(`/discipline/incidents/${incidentId}/notify/`).then((r) => r.data);

export const fetchIncidentsDashboard = (schoolYear: string) =>
  api
    .get<IncidentsDashboard>(`/discipline/dashboard/?school_year=${encodeURIComponent(schoolYear)}`)
    .then((r) => r.data);
