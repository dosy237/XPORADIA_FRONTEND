import { Tabs, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

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

type IconComponent = (props: { color: string; size: number }) => React.ReactElement;

/** Icône + libellé d'un onglet — quand l'onglet est actif, l'ensemble
 * prend un fond orange plein et le texte/icône passent en blanc, au lieu
 * du simple changement de teinte utilisé jusque-là. */
function makeTabBarIcon(Icon: IconComponent, label: string) {
  return ({ focused }: { focused: boolean }) => (
    <View
      className={`items-center justify-center gap-0.5 px-3 py-1 rounded-2xl ${
        focused ? "bg-xporadia-orange" : ""
      }`}
    >
      <Icon color={focused ? Colors.white : Colors.textSecondary} size={20} />
      <Text
        className={`text-[10px] font-semibold ${focused ? "text-white" : "text-xporadia-text-secondary"}`}
      >
        {label}
      </Text>
    </View>
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
        tabBarShowLabel: false,
        tabBarStyle: { borderTopColor: Colors.border },
      }}
    >
      <Tabs.Screen
        name="actualites"
        options={{
          // Stack imbriquée avec son propre header (actualites/_layout.tsx).
          headerShown: false,
          title: "Actualités",
          tabBarIcon: makeTabBarIcon(NewspaperIcon, "Actualités"),
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          headerShown: false,
          title: "Annuaire",
          tabBarIcon: makeTabBarIcon(UsersIcon, "Annuaire"),
        }}
      />
      <Tabs.Screen
        name="certifications"
        options={{
          headerShown: false,
          title: "Certifications & Stages",
          tabBarIcon: makeTabBarIcon(MedalIcon, "Certifications"),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Profil",
          tabBarIcon: makeTabBarIcon(UserCircleIcon, "Profil"),
        }}
      />
    </Tabs>
  );
}
