import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { PlusIcon } from "@/components/ui/Icon";
import { ADMIN_SCOPE_LABELS } from "@/lib/adminScope";
import * as adminManagementApi from "@/services/adminManagement";

export default function AdministratorsScreen() {
  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-list"],
    queryFn: adminManagementApi.fetchAdminList,
  });

  return (
    <View className="flex-1 bg-xporadia-bg">
      <ScrollView contentContainerClassName="p-6 gap-4 pb-24">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-xporadia-navy">Administrateurs</Text>
          <Text className="text-sm text-xporadia-text-secondary leading-5">
            Aucun compte admin ne peut s&apos;inscrire seul, seul un administrateur existant peut en
            créer un nouveau.
          </Text>
        </View>

        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : (
          <View className="gap-3">
            {(admins ?? []).map((a) => (
              <Pressable
                key={a.id}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/admin/edit-admin-scope/[userId]",
                    params: { userId: String(a.id), name: `${a.first_name} ${a.last_name}`, currentScope: a.admin_scope },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Modifier le périmètre de ${a.first_name} ${a.last_name}`}
                className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3"
              >
                <Avatar firstName={a.first_name} lastName={a.last_name} size={40} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-xporadia-text-primary">
                    {a.first_name} {a.last_name}
                  </Text>
                  <Text className="text-xs text-xporadia-text-secondary">{a.email}</Text>
                </View>
                <Chip
                  label={ADMIN_SCOPE_LABELS[a.admin_scope]}
                  variant={a.admin_scope === "full" ? "orange" : "navy-subtle"}
                />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/(app)/admin/create-administrator")}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un administrateur"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-xporadia-orange items-center justify-center shadow-deep-orange"
      >
        <PlusIcon size={22} />
      </Pressable>
    </View>
  );
}
