import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LayersIcon, PlusIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { Department } from "@/services/academics";

function DepartmentCard({ department }: { department: Department }) {
  return (
    <Pressable
      onPress={() => router.push(`/(app)/director/academics/${department.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Voir le département ${department.name}`}
      className="bg-white rounded-2xl p-4 border border-xporadia-border flex-row items-center gap-3"
    >
      <View className="h-10 w-10 rounded-full bg-xporadia-bg items-center justify-center">
        <LayersIcon color={Colors.navy} size={18} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">{department.name}</Text>
        {department.description ? (
          <Text className="text-xs text-xporadia-text-secondary" numberOfLines={1}>
            {department.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function AcademicsScreen() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: academicsApi.fetchDepartments,
  });

  const createMutation = useMutation({
    mutationFn: () => academicsApi.createDepartment({ name, description }),
    onSuccess: (department) => {
      queryClient.setQueryData<Department[] | undefined>(["departments"], (prev) =>
        prev ? [...prev, department] : [department]
      );
      setName("");
      setDescription("");
      setAdding(false);
    },
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Structurez votre établissement en départements, puis filières, puis classes. Chaque
        classe aura un enseignant titulaire.
      </Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (
        (departments ?? []).map((department) => (
          <DepartmentCard key={department.id} department={department} />
        ))
      )}

      {adding ? (
        <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
          <Input label="Nom du département" value={name} onChangeText={setName} placeholder="Secondaire" />
          <Input
            label="Description (optionnel)"
            value={description}
            onChangeText={setDescription}
            placeholder="Collège et lycée"
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Créer"
                pill
                disabled={!name}
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
              />
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un département"
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5"
        >
          <PlusIcon size={16} />
          <Text className="text-white font-semibold">Ajouter un département</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
