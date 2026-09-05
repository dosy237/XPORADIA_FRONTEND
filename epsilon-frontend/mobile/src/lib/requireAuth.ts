import { router } from "expo-router";

/** Garde-fou pour toute action qui suppose un compte (aimer, commenter,
 * publier, suivre...) : un visiteur non connecté est envoyé directement
 * vers la connexion plutôt que de voir l'action échouer sans explication
 * (401 silencieux). Pas d'alerte en plus de la redirection — l'écran de
 * connexion suffit à faire comprendre pourquoi, sans friction inutile.
 * Retourne `true` si l'action peut continuer. */
export function requireAuth(isAuthenticated: boolean): boolean {
  if (isAuthenticated) return true;
  router.push("/(auth)/login");
  return false;
}
