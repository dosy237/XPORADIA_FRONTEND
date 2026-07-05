import { Stack } from "expo-router";

import { Colors } from "@/constants/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
        headerBackTitle: "",
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Connexion" }} />
      <Stack.Screen name="register/index" options={{ title: "Créer un compte" }} />
      <Stack.Screen name="register/teacher" options={{ title: "Inscription enseignant" }} />
      <Stack.Screen name="register/director" options={{ title: "Inscription établissement" }} />
      <Stack.Screen name="register/parent" options={{ title: "Inscription parent" }} />
      <Stack.Screen name="verify-otp" options={{ title: "Vérification du compte" }} />
    </Stack>
  );
}
