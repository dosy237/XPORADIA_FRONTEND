import { router } from "expo-router";
import { Text, View } from "react-native";

import CompanyDashboard from "@/app/(app)/company/dashboard";
import DirectorDashboard from "@/app/(app)/director/dashboard";
import ParentDashboard from "@/app/(app)/parent/dashboard";
import TeacherDashboard from "@/app/(app)/teacher/dashboard";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export default function MeScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentRole = useAuthStore((s) => s.currentRole);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-4">
        <Text className="text-lg font-bold text-xporadia-navy text-center">
          Votre espace personnel
        </Text>
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Connectez-vous pour voir votre profil, vos certifications et gérer votre activité.
        </Text>
        <View className="w-full gap-3 mt-2">
          <Button label="Se connecter" pill onPress={() => router.push("/(auth)/login")} />
          <Button
            label="Créer un compte"
            variant="secondary"
            pill
            onPress={() => router.push("/(auth)/register")}
          />
        </View>
      </View>
    );
  }

  switch (currentRole) {
    case "director":
      return <DirectorDashboard />;
    case "parent":
      return <ParentDashboard />;
    case "company":
      return <CompanyDashboard />;
    case "teacher":
    default:
      return <TeacherDashboard />;
  }
}
