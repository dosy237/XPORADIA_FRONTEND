import { Linking } from "react-native";

/** Ouvre Google Maps (app si installée, sinon navigateur) sur une
 * recherche textuelle — pas besoin de coordonnées, une adresse/ville
 * suffit, cohérent avec ce que l'app stocke déjà (location/city/address). */
export function openInMaps(query: string) {
  if (!query) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  Linking.openURL(url).catch(() => {});
}
