import { serverNow } from "@/lib/serverClock";

/** Formate une date ISO en "il y a X min/h/j" — évite d'ajouter une
 * dépendance (date-fns/dayjs) pour un besoin aussi ponctuel.
 *
 * Le temps écoulé est calculé par rapport à l'horloge du SERVEUR (voir
 * serverClock.ts), pas celle de l'appareil : un téléphone mal réglé ne
 * doit pas afficher un temps écoulé faux. */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = serverNow() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  // Espace insécable entre le nombre et l'unité : évite qu'un retour à la
  // ligne (notamment avec une taille de police système agrandie) ne
  // sépare "10" de "min" sur deux lignes et ne donne l'impression que le
  // texte est tronqué.
  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `il y a ${diffDays} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
