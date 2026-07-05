import type { Href } from "expo-router";

import type { UserRole } from "@/types/user";

// Seuls enseignant / directeur / parent ont un dashboard pour l'instant
// (EP-01 Sprint 1). Entreprise, formateur et admin arriveront avec EP-03/EP-06.
const DASHBOARD_ROUTES = {
  teacher: "/(app)/teacher/dashboard",
  director: "/(app)/director/dashboard",
  parent: "/(app)/parent/dashboard",
} as const satisfies Partial<Record<UserRole, Href>>;

export function dashboardPathForRole(role: UserRole | null | undefined): Href {
  if (role && role in DASHBOARD_ROUTES) {
    return DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES];
  }
  return "/(auth)/login";
}
