import { Stack } from "expo-router";

import { HeaderActions } from "@/components/layout/HeaderActions";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function ActualitesStackLayout() {
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
      <Stack.Screen name="index" options={{ title: "Actualités" }} />
      <Stack.Screen name="compose" options={{ title: "Nouvelle publication", presentation: "modal" }} />
      <Stack.Screen name="[postId]" options={{ title: "Publication" }} />
    </Stack>
  );
}
