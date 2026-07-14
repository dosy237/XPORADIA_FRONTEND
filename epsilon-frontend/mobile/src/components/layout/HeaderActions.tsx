import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { BellIcon, GearIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as notificationsApi from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";

// Icônes notifications/réglages/déconnexion communes aux écrans
// authentifiés — que ce soit la Stack (app) ou l'onglet Espace personnel.
export function HeaderActions() {
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
