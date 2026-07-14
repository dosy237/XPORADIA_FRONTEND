import { useQuery } from "@tanstack/react-query";
import { Redirect, router, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { BellIcon, GearIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as notificationsApi from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";

function HeaderActions() {
  const logout = useAuthStore((s) => s.logout);
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.fetchNotifications,
  });
  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <View className="flex-row items-center gap-4">
      <Pressable
        onPress={() => router.push("/(app)/notifications")}
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : "Notifications"
        }
        hitSlop={8}
        className="relative"
      >
        <BellIcon color={Colors.white} size={20} />
        {unreadCount > 0 && (
          <View className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-xporadia-orange items-center justify-center">
            <Text className="text-white text-[9px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
      <Pressable
        onPress={() => router.push("/(app)/settings")}
        accessibilityRole="button"
        accessibilityLabel="Paramètres du compte"
        hitSlop={8}
      >
        <GearIcon color={Colors.white} size={20} />
      </Pressable>
      <Pressable
        onPress={logout}
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
        hitSlop={8}
      >
        <Text style={{ color: Colors.white }}>Déconnexion</Text>
      </Pressable>
    </View>
  );
}

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
      <Stack.Screen name="director/dashboard" options={{ title: "Espace établissement" }} />
      <Stack.Screen name="director/profile" options={{ title: "Mon établissement" }} />
      <Stack.Screen name="parent/dashboard" options={{ title: "Espace parent" }} />
      <Stack.Screen name="parent/profile" options={{ title: "Mes enfants" }} />
      <Stack.Screen name="company/dashboard" options={{ title: "Espace entreprise" }} />
      <Stack.Screen name="company/profile" options={{ title: "Mon entreprise" }} />
      <Stack.Screen name="settings" options={{ title: "Paramètres" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
    </Stack>
  );
}
