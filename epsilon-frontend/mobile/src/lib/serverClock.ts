/** Écart entre l'horloge du serveur et celle de l'appareil — si le
 * téléphone a une date/heure mal réglée, un calcul de temps relatif basé
 * sur `Date.now()` seul afficherait un temps écoulé faux (ex. une
 * publication qui vient d'être postée affichée comme "il y a 3 h").
 * Chaque réponse API porte l'heure exacte du serveur dans l'en-tête HTTP
 * `Date` ; on s'en sert pour corriger `Date.now()` sans dépendre d'un
 * endpoint dédié. */
let offsetMs = 0;

export function syncServerClock(dateHeader: string | undefined) {
  if (!dateHeader) return;
  const serverTime = new Date(dateHeader).getTime();
  if (Number.isNaN(serverTime)) return;
  offsetMs = serverTime - Date.now();
}

/** Équivalent de Date.now() mais corrigé de l'écart avec le serveur. */
export function serverNow(): number {
  return Date.now() + offsetMs;
}
