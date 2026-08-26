import { router } from "expo-router";
// SDK 54+ a introduit une nouvelle API (Paths/File/Directory) et déplacé
// l'ancienne (downloadAsync/cacheDirectory, utilisée ici) sous ce
// sous-module de compatibilité — toujours officiellement supportée, pas
// dépréciée, juste réorganisée.
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { API_URL } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

function resolveUrl(source: string) {
  return source.startsWith("http") ? source : `${API_URL}${source}`;
}

function authHeaders(): Record<string, string> {
  const { accessToken } = useAuthStore.getState();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

/** Un nom de fichier accentue (ex. "bulletin_Deuxieme_trimestre.pdf")
 * fait echouer l'attribut `download` sur certains navigateurs, qui
 * retombent alors sur un nom generique "download" sans extension : les
 * accents sont retires pour un nom de fichier fiable partout. */
function sanitizeFilename(filename: string): string {
  return filename
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]/g, "_");
}

/** Recupere un document distant vers une URI utilisable localement
 * (blob: sur web, file:// sur natif) : necessaire pour tout document
 * protege par authentification, puisque ni `<iframe src>` (web) ni la
 * `source={{ uri }}` de `WebView` (natif) ne peuvent transmettre un
 * en-tete Authorization eux-memes. Utilise aussi bien pour ouvrir un
 * document dans le visualisateur in-app que pour le telecharger. */
async function fetchToLocalUri(source: string, filename: string, authenticated: boolean): Promise<string> {
  const url = resolveUrl(source);
  if (Platform.OS === "web") {
    const response = await fetch(url, { headers: authenticated ? authHeaders() : {} });
    if (!response.ok) throw new Error(`Echec du telechargement (${response.status})`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
  const localUri = `${FileSystem.cacheDirectory}${sanitizeFilename(filename)}`;
  const { uri } = await FileSystem.downloadAsync(url, localUri, {
    headers: authenticated ? authHeaders() : {},
  });
  return uri;
}

/** Ouvre un PDF dans le visualisateur in-app existant (`/library/pdf-
 * viewer`). `authenticated: true` pour un endpoint API protege (ex. mes
 * resultats, regenere a la demande) ; `false` pour une URL de media deja
 * publique (ex. bulletin deja genere et stocke), chargee directement sans
 * etape de recuperation intermediaire. */
export async function viewPdf(
  source: string,
  title: string,
  options: { authenticated?: boolean; filename?: string } = {}
) {
  let uri = options.authenticated
    ? await fetchToLocalUri(source, options.filename ?? "document.pdf", true)
    : resolveUrl(source);
  // Sur Android, la WebView refuse de charger un file:// pointant vers le
  // cache privé de l'app (ERR_ACCESS_DENIED) — il faut le faire passer par
  // le ContentResolver du système (content://) pour qu'elle y ait accès.
  // Sans effet sur un file:// distant/web, uniquement pertinent après un
  // téléchargement local (authenticated: true).
  if (options.authenticated && Platform.OS === "android") {
    uri = await FileSystem.getContentUriAsync(uri);
  }
  router.push(`/(app)/library/pdf-viewer?url=${encodeURIComponent(uri)}&title=${encodeURIComponent(title)}`);
}

/** Telecharge un PDF sur l'appareil : un vrai telechargement navigateur
 * sur web (lien avec attribut `download`), une feuille de partage
 * native (Enregistrer dans Fichiers, partager par mail...) sur
 * iOS/Android, faute d'equivalent direct "telechargement" cote mobile. */
export async function downloadPdf(source: string, filename: string, options: { authenticated?: boolean } = {}) {
  const safeFilename = sanitizeFilename(filename);
  const uri = await fetchToLocalUri(source, safeFilename, !!options.authenticated);
  if (Platform.OS === "web") {
    const link = document.createElement("a");
    link.href = uri;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(uri);
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: safeFilename });
  }
}
