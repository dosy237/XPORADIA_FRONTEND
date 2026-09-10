import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BookIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as adminApi from "@/services/adminPanel";

export default function LibraryModerationScreen() {
  const queryClient = useQueryClient();
  const { data: resources, isLoading } = useQuery({
    queryKey: ["pending-library"],
    queryFn: adminApi.fetchPendingLibrary,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      adminApi.moderateLibraryResource(id, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-library"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Modération bibliothèque</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Contributions d&apos;enseignants Or, tous établissements confondus.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !resources || resources.length === 0 ? (
        <View className="items-center gap-2 py-10">
          <BookIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Rien en attente pour l&apos;instant.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {resources.map((resource) => (
            <View key={resource.id} className="bg-white rounded-2xl p-4 shadow-soft gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">
                  {resource.title}
                </Text>
                <Chip label={resource.subject} variant="navy-subtle" />
              </View>
              <Text className="text-xs text-xporadia-text-secondary">
                {resource.author_name} · {resource.establishment_name} · {resource.level}
              </Text>
              <View className="flex-row gap-2 mt-1">
                <View className="flex-1">
                  <Button
                    label="Rejeter"
                    variant="secondary"
                    pill
                    onPress={() => moderateMutation.mutate({ id: resource.id, approve: false })}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Approuver"
                    pill
                    onPress={() => moderateMutation.mutate({ id: resource.id, approve: true })}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
