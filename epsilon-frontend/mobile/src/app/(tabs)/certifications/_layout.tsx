import { Stack } from "expo-router";

import { HeaderActions } from "@/components/layout/HeaderActions";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function CertificationsStackLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
        headerRight: isAuthenticated ? () => <HeaderActions /> : undefined,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Certifications & Stages" }} />
      <Stack.Screen name="[moduleId]" options={{ title: "Module de formation" }} />
      <Stack.Screen name="stage/[offerId]" options={{ title: "Offre de stage" }} />
    </Stack>
  );
}
