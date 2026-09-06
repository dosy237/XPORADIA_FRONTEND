import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BellIcon, BuildingIcon, GearIcon, LogoutIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as directorProfileApi from "@/services/directorProfile";
import * as notificationsApi from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";

/** Sélecteur discret d'établissement, pour un directeur membre d'un
 * groupe scolaire de plusieurs établissements — bascule vers la vue
 * consolidée en lecture d'un établissement voisin sans se déconnecter
 * ni perdre sa position (voir director/school-group/establishment). */
function SchoolGroupSwitcher() {
  const currentRole = useAuthStore((s) => s.currentRole);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const { data: group } = useQuery({
    queryKey: ["my-school-group"],
    queryFn: directorProfileApi.fetchMySchoolGroup,
    enabled: currentRole === "director",
  });

  if (currentRole !== "director" || !group || group.establishments.length < 2) return null;

  const mine = group.establishments.find((e) => e.director_id === user?.id);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Changer d'établissement du groupe"
        className="flex-row items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"
        hitSlop={8}
      >
        <BuildingIcon color={Colors.white} size={16} />
        <Text className="text-white text-[10px]">▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <SafeAreaView edges={["bottom"]} className="bg-white rounded-t-3xl max-h-[70%]">
          <View className="items-center py-3">
            <View className="w-10 h-1 rounded-full bg-xporadia-border" />
          </View>
          <Text className="px-6 pb-2 text-xs font-semibold text-xporadia-text-secondary uppercase">
            Établissements du groupe
          </Text>
          <FlatList
            data={group.establishments}
            keyExtractor={(item) => String(item.director_id)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setOpen(false);
                  router.push({
                    pathname: "/(app)/director/school-group/establishment/[directorId]",
                    params: { directorId: String(item.director_id) },
                  });
                }}
                className="px-6 py-4 border-b border-xporadia-border"
              >
                <Text className="text-base text-xporadia-text-primary">
                  {item.school_name}
                  {item.director_id === user?.id ? " (vous)" : ""}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

// Icônes notifications/réglages/déconnexion communes aux écrans
// authentifiés, que ce soit la Stack (app) ou l'onglet Espace personnel.
export function HeaderActions() {
  const logout = useAuthStore((s) => s.logout);
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.fetchNotifications,
  });
  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <View className="flex-row items-center gap-4">
      <SchoolGroupSwitcher />
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
        <LogoutIcon color={Colors.white} size={20} />
      </Pressable>
    </View>
  );
}
