import { Redirect } from "expo-router";

// L'application s'ouvre toujours sur la coquille à onglets (Actualités /
// Annuaire / Certifications & Stages / Profil), connecté ou non, le
// contenu de chaque onglet s'adapte ensuite à l'état d'authentification.
export default function Index() {
  return <Redirect href="/(tabs)/actualites" />;
}
