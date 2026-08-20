import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { ClockIcon, TrashIcon, UserPlusIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { DelegatedTask } from "@/services/academics";

const TASK_DESCRIPTIONS: Record<DelegatedTask, string> = {
  timetable:
    "L'enseignant délégué pourra créer et modifier l'emploi du temps de toutes les classes de votre établissement — comme un censeur. Il ne pourra jamais toucher aux effectifs, aux inscriptions, ni à la structure académique.",
};

export default function TaskDelegationsScreen() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const { data: delegations, isLoading } = useQuery({
    queryKey: ["task-delegations"],
    queryFn: academicsApi.fetchTaskDelegations,
  });

  const addMutation = useMutation({
    mutationFn: () => academicsApi.addTaskDelegation("timetable", email.trim().toLowerCase()),
    onSuccess: () => {
      setEmail("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["task-delegations"] });
    },
    onError: () => setError("Aucun enseignant actif ne correspond à cet email."),
  });

  const removeMutation = useMutation({
    mutationFn: (teacherEmail: string) => academicsApi.removeTaskDelegation("timetable", teacherEmail),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-delegations"] }),
  });

  const timetableDelegates = (delegations ?? []).filter((d) => d.task === "timetable");

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Délégations de tâches</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Confiez une responsabilité précise à un enseignant de votre établissement — il reste un
          compte enseignant ordinaire, cette délégation ne fait que lui ajouter une capacité.
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
        <View className="flex-row items-center gap-2">
          <ClockIcon size={16} color={Colors.navy} />
          <Text className="text-sm font-bold text-xporadia-navy">Gestion des emplois du temps</Text>
        </View>
        <Text className="text-xs text-xporadia-text-secondary leading-5">
          {TASK_DESCRIPTIONS.timetable}
        </Text>

        {isLoading ? (
          <Text className="text-xs text-xporadia-text-secondary text-center py-2">Chargement...</Text>
        ) : timetableDelegates.length > 0 ? (
          <View className="gap-2">
            {timetableDelegates.map((d) => (
              <View key={d.id} className="flex-row items-center gap-2.5 bg-xporadia-bg rounded-xl p-2.5">
                <Avatar firstName={d.teacher.first_name} lastName={d.teacher.last_name} imageUri={d.teacher.avatar} size={30} />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-xporadia-text-primary">
                    {d.teacher.first_name} {d.teacher.last_name}
                  </Text>
                  <Text className="text-[11px] text-xporadia-text-secondary">{d.teacher.email}</Text>
                </View>
                <Pressable
                  onPress={() => removeMutation.mutate(d.teacher.email)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer la délégation de ${d.teacher.first_name}`}
                >
                  <TrashIcon size={15} color={Colors.red} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center gap-1.5 py-3">
            <UserPlusIcon size={18} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">Personne pour l&apos;instant.</Text>
          </View>
        )}

        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="email@enseignant.ci"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <Pressable
            onPress={() => email.trim() && addMutation.mutate()}
            disabled={!email.trim() || addMutation.isPending}
            className="h-11 px-4 rounded-xl bg-xporadia-navy items-center justify-center"
          >
            <Text className="text-white text-xs font-semibold">Déléguer</Text>
          </Pressable>
        </View>
        {error ? <Text className="text-xs text-xporadia-red -mt-1">{error}</Text> : null}
      </View>

      <View className="bg-xporadia-navy/[0.04] rounded-2xl p-4">
        <Text className="text-xs text-xporadia-text-secondary leading-5">
          D&apos;autres tâches délégables (surveillance, discipline...) pourront s&apos;ajouter ici à
          l&apos;avenir. Un département reste toujours créé par vous seul(e) : il ne fait jamais
          partie des tâches délégables.
        </Text>
      </View>
    </ScrollView>
  );
}
