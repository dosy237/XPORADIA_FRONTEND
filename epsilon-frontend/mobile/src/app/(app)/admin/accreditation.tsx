import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as adminApi from "@/services/adminPanel";

const ROLE_LABELS: Record<string, string> = { teacher: "Enseignant", director: "Directeur" };

export default function AccreditationScreen() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["pending-accreditation"],
    queryFn: adminApi.fetchPendingAccreditation,
  });

  const validateMutation = useMutation({
    mutationFn: (userId: number) => adminApi.validateAccreditation(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-accreditation"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Accréditations</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Comptes enseignant/directeur en attente de validation après formation présentielle.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !users || users.length === 0 ? (
        <View className="items-center gap-2 py-10">
          <CheckCircleIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucune accréditation en attente.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {users.map((u) => (
            <View key={u.id} className="bg-white rounded-2xl p-4 shadow-soft gap-3">
              <View className="flex-row items-center gap-3">
                <Avatar firstName={u.first_name} lastName={u.last_name} imageUri={u.avatar} size={40} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-xporadia-text-primary">
                    {u.first_name} {u.last_name}
                  </Text>
                  <Text className="text-xs text-xporadia-text-secondary">{u.email}</Text>
                </View>
                <Chip label={ROLE_LABELS[u.primary_role]} variant="navy-subtle" />
              </View>
              <Button
                label="Valider l'accréditation"
                pill
                loading={validateMutation.isPending}
                onPress={() => validateMutation.mutate(u.id)}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
