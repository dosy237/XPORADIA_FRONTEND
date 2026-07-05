import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";

export default function DirectorDashboard() {
  return (
    <DashboardPlaceholder
      title="Gérez vos recrutements et vos stages."
      upcomingFeatures={[
        "Recherche d'enseignants certifiés (EP-03)",
        "Offres d'emploi et candidatures reçues (EP-03)",
        "Suivi des stages de l'établissement (EP-04)",
      ]}
    />
  );
}
