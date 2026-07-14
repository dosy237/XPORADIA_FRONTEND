import type { Href } from "expo-router";

import type { UserRole } from "@/types/user";

// Enseignant / directeur / parent / entreprise ont un dashboard (EP-01).
// Formateur et admin arriveront avec EP-06.
const DASHBOARD_ROUTES = {
  teacher: "/(app)/teacher/dashboard",
  director: "/(app)/director/dashboard",
  parent: "/(app)/parent/dashboard",
  company: "/(app)/company/dashboard",
} as const satisfies Partial<Record<UserRole, Href>>;

export function dashboardPathForRole(role: UserRole | null | undefined): Href {
  if (role && role in DASHBOARD_ROUTES) {
    return DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES];
  }
  return "/(auth)/login";
}
