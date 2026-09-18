import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { SearchIcon, UsersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as adminUsersApi from "@/services/adminUsers";
import type { ManagedRole } from "@/services/adminUsers";

const ROLES: { value: ManagedRole; label: string }[] = [
  { value: "student", label: "Élèves" },
  { value: "teacher", label: "Enseignants" },
  { value: "director", label: "Établissements" },
  { value: "company", label: "Entreprises" },
];

export default function AdminUsersScreen() {
  const [role, setRole] = useState<ManagedRole>("student");
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", role, search],
    queryFn: () => adminUsersApi.fetchAdminUsers(role, search || undefined),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Comptes utilisateurs</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Recherche, consultation, suspension réversible.
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {ROLES.map((r) => (
          <Pressable key={r.value} onPress={() => setRole(r.value)}>
            <Chip label={r.label} variant={role === r.value ? "navy" : "neutral"} />
          </Pressable>
        ))}
      </View>

      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Nom ou email..."
        leftIcon={<SearchIcon size={16} color={Colors.textSecondary} />}
      />

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !users || users.length === 0 ? (
        <View className="items-center gap-2 py-10">
          <UsersIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucun compte trouvé.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {users.map((u) => (
            <Pressable
              key={u.id}
              onPress={() => router.push(`/(app)/admin/user-detail/${u.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Voir ${u.first_name} ${u.last_name}`}
              className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3"
            >
              <Avatar firstName={u.first_name} lastName={u.last_name} imageUri={u.avatar} size={40} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  {u.first_name} {u.last_name}
                </Text>
                <Text className="text-xs text-xporadia-text-secondary">{u.email}</Text>
              </View>
              {!u.is_active ? <Chip label="Suspendu" variant="orange" /> : null}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
