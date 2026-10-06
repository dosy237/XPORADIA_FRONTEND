import type { AdminScope } from "@/types/user";

/** "full" a toujours tous les droits ; sinon il faut que le périmètre de
 * l'administrateur figure explicitement dans la liste autorisée. */
export function adminHasScope(scope: AdminScope | null | undefined, ...allowed: AdminScope[]): boolean {
  if (!scope) return false;
  return scope === "full" || allowed.includes(scope);
}

export const ADMIN_SCOPE_LABELS: Record<AdminScope, string> = {
  full: "Administrateur complet",
  moderation: "Modérateur",
  accounts: "Gestionnaire de comptes",
  catalog: "Gestionnaire de contenu",
};
