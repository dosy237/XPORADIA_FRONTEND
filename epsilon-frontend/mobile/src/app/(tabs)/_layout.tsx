import { Tabs, router } from "expo-router";
import { Pressable, Text } from "react-native";

import { HeaderActions } from "@/components/layout/HeaderActions";
import { HomeIcon, MedalIcon, UserCircleIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

function HeaderRight() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) return <HeaderActions />;

  return (
    <Pressable
      onPress={() => router.push("/(auth)/welcome")}
      accessibilityRole="button"
      accessibilityLabel="Se connecter"
      hitSlop={8}
    >
      <Text style={{ color: Colors.white, fontWeight: "600" }}>Se connecter</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
        headerRight: () => <HeaderRight />,
        tabBarActiveTintColor: Colors.navy,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: { borderTopColor: Colors.border },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          // Cet onglet est une Stack imbriquée (feed/_layout.tsx) qui gère
          // déjà son propre header — sans ça, les deux se superposent.
          headerShown: false,
          title: "Fil d'actualité",
          tabBarLabel: "Fil",
          tabBarIcon: ({ color, size }) => <HomeIcon color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="certifications"
        options={{
          headerShown: false,
          title: "Certifications",
          tabBarLabel: "Certifications",
          tabBarIcon: ({ color, size }) => <MedalIcon color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Espace personnel",
          tabBarLabel: "Espace personnel",
          tabBarIcon: ({ color, size }) => <UserCircleIcon color={String(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
