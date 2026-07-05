import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";

export default function TeacherDashboard() {
  return (
    <DashboardPlaceholder
      title="Suivez votre certification et vos opportunités."
      upcomingFeatures={[
        "Statut de certification et modules de formation (EP-02)",
        "Offres d'emploi et candidatures (EP-03)",
        "Cours particuliers et agenda (EP-05)",
      ]}
    />
  );
}
