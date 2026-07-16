import { Redirect, Stack } from "expo-router";

import { HeaderActions } from "@/components/layout/HeaderActions";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
        headerRight: () => <HeaderActions />,
      }}
    >
      <Stack.Screen name="teacher/dashboard" options={{ title: "Espace enseignant" }} />
      <Stack.Screen name="teacher/profile" options={{ title: "Mon profil" }} />
      <Stack.Screen name="teacher/certification" options={{ title: "Ma certification" }} />
      <Stack.Screen name="teacher/module/[moduleId]" options={{ title: "Module de formation" }} />
      <Stack.Screen name="teacher/directory" options={{ title: "Annuaire des enseignants" }} />
      <Stack.Screen name="teacher/directory/[userId]" options={{ title: "Profil enseignant" }} />
      <Stack.Screen name="teacher/my-classes/index" options={{ title: "Mes classes" }} />
      <Stack.Screen name="teacher/my-classes/[classId]" options={{ title: "Matières de la classe" }} />
      <Stack.Screen name="teacher/my-subjects" options={{ title: "Mes matières" }} />
      <Stack.Screen name="teacher/subject/[subjectId]" options={{ title: "Cours & exercices" }} />
      <Stack.Screen name="teacher/job-offers/index" options={{ title: "Offres d'emploi" }} />
      <Stack.Screen name="teacher/job-offers/[listingId]" options={{ title: "Offre d'emploi" }} />
      <Stack.Screen name="teacher/my-applications" options={{ title: "Mes candidatures" }} />
      <Stack.Screen name="teacher/job-seeking" options={{ title: "Demande d'emploi" }} />
      <Stack.Screen name="director/dashboard" options={{ title: "Espace établissement" }} />
      <Stack.Screen name="director/profile" options={{ title: "Mon établissement" }} />
      <Stack.Screen name="director/academics/index" options={{ title: "Structure académique" }} />
      <Stack.Screen name="director/academics/[departmentId]" options={{ title: "Département" }} />
      <Stack.Screen name="director/academics/track/[trackId]" options={{ title: "Filière" }} />
      <Stack.Screen name="director/job-listings/index" options={{ title: "Offres d'emploi" }} />
      <Stack.Screen name="director/job-listings/[listingId]" options={{ title: "Candidatures" }} />
      <Stack.Screen name="director/internship-offers/index" options={{ title: "Offres de stage" }} />
      <Stack.Screen name="director/internship-offers/[offerId]" options={{ title: "Offre de stage" }} />
      <Stack.Screen
        name="director/my-internship-applications"
        options={{ title: "Mes candidatures de stage" }}
      />
      <Stack.Screen name="library" options={{ title: "Bibliothèque numérique" }} />
      <Stack.Screen name="class-roster/[classId]" options={{ title: "Effectifs" }} />
      <Stack.Screen name="parent/dashboard" options={{ title: "Espace parent" }} />
      <Stack.Screen name="parent/profile" options={{ title: "Mes enfants" }} />
      <Stack.Screen name="company/dashboard" options={{ title: "Espace entreprise" }} />
      <Stack.Screen name="company/profile" options={{ title: "Mon entreprise" }} />
      <Stack.Screen name="company/internship-offers/index" options={{ title: "Offres de stage" }} />
      <Stack.Screen name="company/internship-offers/[offerId]" options={{ title: "Candidatures" }} />
      <Stack.Screen name="internship-convention/index" options={{ title: "Conventions de stage" }} />
      <Stack.Screen name="internship-convention/[conventionId]" options={{ title: "Convention de stage" }} />
      <Stack.Screen name="settings" options={{ title: "Paramètres" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
    </Stack>
  );
}
