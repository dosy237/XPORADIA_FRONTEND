import { Tabs, router } from "expo-router";
import { Pressable, Text } from "react-native";

import { HeaderActions } from "@/components/layout/HeaderActions";
import { MedalIcon, NewspaperIcon, UserCircleIcon, UsersIcon } from "@/components/ui/Icon";
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
        name="actualites"
        options={{
          // Stack imbriquée avec son propre header (actualites/_layout.tsx).
          headerShown: false,
          title: "Actualités",
          tabBarLabel: "Actualités",
          tabBarIcon: ({ color, size }) => <NewspaperIcon color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          headerShown: false,
          title: "Annuaire",
          tabBarLabel: "Annuaire",
          tabBarIcon: ({ color, size }) => <UsersIcon color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="certifications"
        options={{
          headerShown: false,
          title: "Certifications & Stages",
          tabBarLabel: "Certifications",
          tabBarIcon: ({ color, size }) => <MedalIcon color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => <UserCircleIcon color={String(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
