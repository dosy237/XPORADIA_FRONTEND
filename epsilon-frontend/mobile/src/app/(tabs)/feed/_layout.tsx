import { Stack } from "expo-router";

import { HeaderActions } from "@/components/layout/HeaderActions";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function FeedStackLayout() {
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
      <Stack.Screen name="index" options={{ title: "Fil d'actualité" }} />
      <Stack.Screen name="[userId]" options={{ title: "Profil enseignant" }} />
      <Stack.Screen name="establishment/[userId]" options={{ title: "Établissement" }} />
    </Stack>
  );
}
