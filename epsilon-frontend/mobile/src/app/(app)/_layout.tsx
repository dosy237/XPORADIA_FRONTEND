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
      <Stack.Screen name="teacher/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="teacher/profile" options={{ title: "Mon profil" }} />
      <Stack.Screen name="teacher/certification" options={{ title: "Ma certification" }} />
      <Stack.Screen
        name="teacher/my-session-enrollments"
        options={{ title: "Mes inscriptions aux sessions" }}
      />
      <Stack.Screen name="teacher/online-exam/[moduleId]" options={{ title: "Examen en ligne" }} />
      <Stack.Screen name="teacher/my-classes/index" options={{ title: "Mes classes" }} />
      <Stack.Screen name="teacher/my-classes/[classId]" options={{ title: "Matières de la classe" }} />
      <Stack.Screen name="teacher/my-subjects" options={{ title: "Mes matières" }} />
      <Stack.Screen name="teacher/agenda" options={{ title: "Mon agenda" }} />
      <Stack.Screen name="teacher/subject/[subjectId]" options={{ title: "Cours & exercices" }} />
      <Stack.Screen
        name="teacher/exercise-submissions/[exerciseId]"
        options={{ title: "Copies des élèves" }}
      />
      <Stack.Screen name="teacher/job-offers/index" options={{ title: "Offres d'emploi" }} />
      <Stack.Screen name="teacher/job-offers/[listingId]" options={{ title: "Offre d'emploi" }} />
      <Stack.Screen name="teacher/my-applications" options={{ title: "Mes candidatures" }} />
      <Stack.Screen name="teacher/my-recruitments" options={{ title: "Mes postes" }} />
      <Stack.Screen name="teacher/my-delegations" options={{ title: "Mes délégations" }} />
      <Stack.Screen name="teacher/timetable-delegation/index" options={{ title: "Emplois du temps" }} />
      <Stack.Screen name="teacher/timetable-editor/[classId]" options={{ title: "Emploi du temps" }} />
      <Stack.Screen name="teacher/year-end-promotion/[classId]" options={{ title: "Fin d'année" }} />
      <Stack.Screen name="teacher/report-cards/[classId]" options={{ title: "Bulletins du trimestre" }} />
      <Stack.Screen name="teacher/recruitment/[recruitmentId]" options={{ title: "Heures travaillées" }} />
      <Stack.Screen name="teacher/wallet" options={{ title: "Portefeuille" }} />
      <Stack.Screen name="teacher/job-seeking" options={{ title: "Demande d'emploi" }} />
      <Stack.Screen name="director/dashboard" options={{ title: "Espace établissement" }} />
      <Stack.Screen name="director/profile" options={{ title: "Mon établissement" }} />
      <Stack.Screen name="director/academics/index" options={{ title: "Structure académique" }} />
      <Stack.Screen name="director/task-delegations" options={{ title: "Délégations de tâches" }} />
      <Stack.Screen name="director/academics/[departmentId]" options={{ title: "Département" }} />
      <Stack.Screen name="director/academics/track/[trackId]" options={{ title: "Filière" }} />
      <Stack.Screen name="director/job-listings/index" options={{ title: "Offres d'emploi" }} />
      <Stack.Screen name="director/worked-hours/index" options={{ title: "Heures à valider" }} />
      <Stack.Screen name="director/invoices/index" options={{ title: "Factures" }} />
      <Stack.Screen name="director/worked-hours/[recruitmentId]" options={{ title: "Validation des heures" }} />
      <Stack.Screen name="director/join-requests/index" options={{ title: "Demandes de rattachement" }} />
      <Stack.Screen name="director/admission-report/index" options={{ title: "Rapport d'admission" }} />
      <Stack.Screen name="director/year-end-readiness/index" options={{ title: "Suivi de fin d'année" }} />
      <Stack.Screen name="start-of-year-check/index" options={{ title: "Vérification de rentrée" }} />
      <Stack.Screen name="director/job-listings/[listingId]" options={{ title: "Candidatures" }} />
      <Stack.Screen name="director/teacher-search/index" options={{ title: "Recherche d'enseignants" }} />
      <Stack.Screen name="director/teacher-search/[userId]" options={{ title: "Profil enseignant" }} />
      <Stack.Screen name="director/internship-offers/index" options={{ title: "Offres de stage" }} />
      <Stack.Screen name="director/internship-offers/[offerId]" options={{ title: "Offre de stage" }} />
      <Stack.Screen
        name="director/my-internship-applications"
        options={{ title: "Mes candidatures de stage" }}
      />
      <Stack.Screen name="library/index" options={{ title: "Bibliothèque numérique" }} />
      <Stack.Screen name="library/[resourceId]" options={{ title: "Ressource" }} />
      <Stack.Screen name="library/publish" options={{ title: "Publier une ressource" }} />
      <Stack.Screen name="library/pdf-viewer" options={{ title: "Document" }} />
      <Stack.Screen name="class-roster/[classId]" options={{ title: "Effectifs" }} />
      <Stack.Screen name="parent/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="parent/profile" options={{ title: "Mes enfants" }} />
      <Stack.Screen name="parent/child-space/[childId]" options={{ title: "Espace élève" }} />
      <Stack.Screen name="parent/claim-child" options={{ title: "Réclamer un enfant" }} />
      <Stack.Screen name="student/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="student/class" options={{ title: "Ma classe" }} />
      <Stack.Screen name="student/subjects" options={{ title: "Mes matières" }} />
      <Stack.Screen name="student/timetable" options={{ title: "Emploi du temps" }} />
      <Stack.Screen name="student/goals" options={{ title: "Vie & objectifs" }} />
      <Stack.Screen name="student/grades" options={{ title: "Mes résultats" }} />
      <Stack.Screen name="student/report-cards" options={{ title: "Bulletins" }} />
      <Stack.Screen name="student/internship" options={{ title: "Mon stage" }} />
      <Stack.Screen name="messages/index" options={{ title: "Messagerie" }} />
      <Stack.Screen name="messages/[channelId]" options={{ title: "Conversation" }} />
      <Stack.Screen name="messages/publish-exercise" options={{ title: "Publier un devoir" }} />
      <Stack.Screen name="teacher/exercise-overview/[exerciseId]" options={{ title: "Devoir" }} />
      <Stack.Screen name="teacher/grade-grid/[subjectId]" options={{ title: "Tableur de notes" }} />
      <Stack.Screen name="student/my-exercises" options={{ title: "Mes devoirs" }} />
      <Stack.Screen name="student/assignments/index" options={{ title: "Mes devoirs" }} />
      <Stack.Screen name="student/assignments/[exerciseId]" options={{ title: "Devoir" }} />
      <Stack.Screen name="student/notes/index" options={{ title: "Notes & documents" }} />
      <Stack.Screen name="student/notes/[noteId]" options={{ title: "Note" }} />
      <Stack.Screen name="company/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin/accreditation" options={{ title: "Accréditations" }} />
      <Stack.Screen name="admin/library-moderation" options={{ title: "Modération bibliothèque" }} />
      <Stack.Screen name="admin/disputes" options={{ title: "Litiges" }} />
      <Stack.Screen name="admin/administrators" options={{ title: "Administrateurs" }} />
      <Stack.Screen name="admin/certification-modules" options={{ title: "Modules de formation" }} />
      <Stack.Screen name="admin/job-listings" options={{ title: "Offres d'emploi" }} />
      <Stack.Screen name="admin/internship-offers" options={{ title: "Offres de stage" }} />
      <Stack.Screen name="admin/users/index" options={{ title: "Comptes utilisateurs" }} />
      <Stack.Screen name="admin/user-detail/[userId]" options={{ title: "Fiche compte" }} />
      <Stack.Screen name="company/profile" options={{ title: "Mon entreprise" }} />
      <Stack.Screen name="company/teacher-search/index" options={{ title: "Recherche d'enseignants" }} />
      <Stack.Screen name="company/teacher-search/[userId]" options={{ title: "Profil enseignant" }} />
      <Stack.Screen name="company/internship-offers/index" options={{ title: "Offres de stage" }} />
      <Stack.Screen name="company/internship-offers/[offerId]" options={{ title: "Candidatures" }} />
      <Stack.Screen name="internship-convention/index" options={{ title: "Conventions de stage" }} />
      <Stack.Screen name="internship-convention/[conventionId]" options={{ title: "Convention de stage" }} />
      <Stack.Screen name="settings" options={{ title: "Paramètres" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="my-posts" options={{ title: "Mes publications" }} />
    </Stack>
  );
}
