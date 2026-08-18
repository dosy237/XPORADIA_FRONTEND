import { LinearGradient } from "expo-linear-gradient";
import { Tabs, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { GestureResponderEvent, StyleProp, ViewStyle } from "react-native";

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

// Props réellement passées par expo-router/react-navigation à un
// tabBarButton personnalisé (le type BottomTabBarButtonProps n'est pas
// exporté publiquement par le package, donc on ne déclare que ce qu'on
// utilise plutôt que d'importer un chemin interne fragile).
interface TabBarButtonProps {
  onPress?: ((e: GestureResponderEvent) => void) | null;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  "aria-selected"?: boolean;
  "aria-label"?: string;
}

/** Bouton d'onglet entièrement personnalisé — icône + libellé, fond
 * orange plein et texte blanc quand actif.
 *
 * Important : on N'UTILISE PAS `tabBarIcon` pour ça. `tabBarIcon` est
 * enveloppé par la librairie dans une boîte fixe de 31×28dp (taille
 * pensée pour une icône seule, voir TabBarIcon.js) — y glisser un texte
 * de plusieurs caractères le forçait à retourner à la ligne lettre par
 * lettre. `tabBarButton` remplace le bouton d'onglet en entier et hérite
 * de la largeur normale de l'onglet (flex réparti sur toute la barre),
 * donc le texte s'affiche enfin sur une seule ligne. */
function makeTabBarButton(Icon: IconComponent, label: string) {
  return function TabButton({ onPress, onLongPress, testID, style, ...aria }: TabBarButtonProps) {
    const focused = Boolean(aria["aria-selected"]);
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        testID={testID}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={aria["aria-label"] ?? label}
        style={[style, { alignItems: "center", justifyContent: "center" }]}
      >
        {focused ? (
          // Le dégradé EST le conteneur (comme pour Button.tsx) plutôt qu'une
          // couche de fond en position absolue : plus fiable, sa taille suit
          // directement le contenu (icône + texte) au lieu de dépendre d'un
          // parent auto-dimensionné.
          <LinearGradient
            colors={["#FF7A33", "#FB5406"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="items-center justify-center gap-0.5 px-2 py-1 rounded-2xl shadow-deep-orange"
          >
            <Icon color={Colors.white} size={20} />
            <Text numberOfLines={1} className="text-[10px] font-semibold text-white">
              {label}
            </Text>
          </LinearGradient>
        ) : (
          <View className="items-center justify-center gap-0.5 px-2 py-1">
            <Icon color={Colors.textSecondary} size={20} />
            <Text numberOfLines={1} className="text-[10px] font-semibold text-xporadia-text-secondary">
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
        headerRight: () => <HeaderRight />,
        tabBarStyle: { borderTopColor: Colors.border },
      }}
    >
      <Tabs.Screen
        name="actualites"
        options={{
          // Stack imbriquée avec son propre header (actualites/_layout.tsx).
          headerShown: false,
          title: "Actualités",
          tabBarButton: makeTabBarButton(NewspaperIcon, "Actualités"),
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          headerShown: false,
          title: "Annuaire",
          tabBarButton: makeTabBarButton(UsersIcon, "Annuaire"),
        }}
      />
      <Tabs.Screen
        name="certifications"
        options={{
          headerShown: false,
          title: "Certifications & Stages",
          tabBarButton: makeTabBarButton(MedalIcon, "Certifications"),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Profil",
          tabBarButton: makeTabBarButton(UserCircleIcon, "Profil"),
        }}
      />
    </Tabs>
  );
}
