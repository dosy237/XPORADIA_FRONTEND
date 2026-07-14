import { Redirect, Stack } from "expo-router";
import { Pressable, Text } from "react-native";

import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
        headerRight: () => (
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={{ color: Colors.white }}>Déconnexion</Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="teacher/dashboard" options={{ title: "Espace enseignant" }} />
      <Stack.Screen name="teacher/profile" options={{ title: "Mon profil" }} />
      <Stack.Screen name="director/dashboard" options={{ title: "Espace établissement" }} />
      <Stack.Screen name="director/profile" options={{ title: "Mon établissement" }} />
      <Stack.Screen name="parent/dashboard" options={{ title: "Espace parent" }} />
      <Stack.Screen name="parent/profile" options={{ title: "Mes enfants" }} />
      <Stack.Screen name="company/dashboard" options={{ title: "Espace entreprise" }} />
      <Stack.Screen name="company/profile" options={{ title: "Mon entreprise" }} />
    </Stack>
  );
}
