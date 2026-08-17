import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GearIcon, HomeIcon, MenuIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

/** En-tête commun à tous les tableaux de bord de rôle, le ☰ ouvre un menu
 * avec "Retour au menu principal" (les 4 onglets communs), Paramètres, et
 * Déconnexion. Un seul endroit à faire évoluer plutôt qu'un comportement
 * réinventé par écran de dashboard. */
export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const closeAnd = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <View className="bg-xporadia-navy" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 gap-3">
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir le menu"
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <MenuIcon size={18} color={Colors.white} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-bold text-base">{title}</Text>
          {subtitle ? <Text className="text-white/60 text-xs">{subtitle}</Text> : null}
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/30" onPress={() => setMenuOpen(false)}>
          <View
            className="bg-white rounded-2xl mx-4 mt-2 overflow-hidden shadow-deep"
            style={{ marginTop: insets.top + 52 }}
          >
            <Pressable
              onPress={() => closeAnd(() => router.replace("/(tabs)/actualites"))}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-xporadia-bg"
              accessibilityRole="button"
            >
              <HomeIcon size={18} color={Colors.navy} />
              <Text className="text-sm font-medium text-xporadia-text-primary">Retour au menu principal</Text>
            </Pressable>
            <View className="h-px bg-xporadia-border" />
            <Pressable
              onPress={() => closeAnd(() => router.push("/(app)/settings"))}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-xporadia-bg"
              accessibilityRole="button"
            >
              <GearIcon size={18} color={Colors.navy} />
              <Text className="text-sm font-medium text-xporadia-text-primary">Paramètres</Text>
            </Pressable>
            <View className="h-px bg-xporadia-border" />
            <Pressable
              onPress={() => closeAnd(logout)}
              className="px-4 py-3.5 active:bg-xporadia-bg"
              accessibilityRole="button"
            >
              <Text className="text-sm font-medium text-xporadia-red">Se déconnecter</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
