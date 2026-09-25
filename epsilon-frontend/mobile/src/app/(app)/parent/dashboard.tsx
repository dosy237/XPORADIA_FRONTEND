import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { ChildIcon, UserPlusIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as parentApi from "@/services/parentProfile";
import { useAuthStore } from "@/store/authStore";

function ChildCard({ child }: { child: parentApi.Child }) {
  return (
    <Pressable
      onPress={() => router.push(`/(app)/parent/child-space/${child.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Voir l'espace de ${child.first_name}`}
      className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3"
    >
      <Avatar firstName={child.first_name} size={44} />
      <View className="flex-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">{child.first_name}</Text>
        <Text className="text-xs text-xporadia-text-secondary">{child.class_level}</Text>
      </View>
      <Text className="text-xs font-semibold text-xporadia-orange">Voir →</Text>
    </Pressable>
  );
}

export default function ParentDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["parent-profile"],
    queryFn: parentApi.fetchParentProfile,
  });

  return (
    <View className="flex-1 bg-xporadia-bg">
      <DashboardHeader title="Espace parent" subtitle={user ? `${user.first_name} ${user.last_name}` : undefined} />
      <ScrollView contentContainerClassName="p-6 gap-5 pb-12">
        <View className="gap-3">
          <Text className="text-base font-bold text-xporadia-navy">Mes enfants</Text>
          {isLoading ? (
            <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
          ) : profile && profile.children.length > 0 ? (
            <View className="gap-3">
              {profile.children.map((child) => (
                <ChildCard key={child.id} child={child} />
              ))}
            </View>
          ) : (
            <View className="items-center gap-2 py-8">
              <ChildIcon size={24} color={Colors.textSecondary} />
              <Text className="text-xs text-xporadia-text-secondary text-center">
                Aucun enfant ajouté pour l&apos;instant.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => router.push("/(app)/parent/profile")}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un enfant"
          className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3"
        >
          <View className="h-10 w-10 rounded-full bg-xporadia-bg items-center justify-center">
            <ChildIcon size={18} color={Colors.navy} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Ajouter un enfant</Text>
            <Text className="text-xs text-xporadia-text-secondary">Jusqu&apos;à 5 enfants par compte.</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(app)/parent/claim-child")}
          accessibilityRole="button"
          accessibilityLabel="Réclamer un enfant déjà auto-inscrit"
          className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3"
        >
          <View className="h-10 w-10 rounded-full bg-xporadia-orange/10 items-center justify-center">
            <UserPlusIcon size={18} color={Colors.orange} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">
              Réclamer un enfant déjà inscrit
            </Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Votre enfant s&apos;est inscrit lui-même sur Xporadia ? Retrouvez-le ici.
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
