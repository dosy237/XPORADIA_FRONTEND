import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";

export default function ParentDashboard() {
  return (
    <DashboardPlaceholder
      title="Trouvez des cours particuliers certifiés pour vos enfants."
      upcomingFeatures={[
        "Recherche géolocalisée d'enseignants (EP-05)",
        "Réservation de séances et paiement Mobile Money (EP-05)",
        "Suivi de la classe virtuelle de vos enfants (EP-09)",
      ]}
    />
  );
}
