import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PlusIcon, UsersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { SchoolClass } from "@/services/academics";

function ClassCard({ schoolClass }: { schoolClass: SchoolClass }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          {schoolClass.name}
        </Text>
        <Chip label={schoolClass.school_year} variant="navy-subtle" />
      </View>
      <View className="flex-row items-center gap-2">
        <UsersIcon color={Colors.textSecondary} size={14} />
        <Text className="text-xs text-xporadia-text-secondary">
          {schoolClass.homeroom_teacher
            ? `Titulaire : ${schoolClass.homeroom_teacher.first_name} ${schoolClass.homeroom_teacher.last_name}`
            : "Aucun titulaire affecté"}
        </Text>
      </View>
      {schoolClass.capacity ? (
        <Text className="text-xs text-xporadia-text-secondary">
          Effectif maximum : {schoolClass.capacity}
        </Text>
      ) : null}
    </View>
  );
}

export default function TrackClassesScreen() {
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [homeroomEmail, setHomeroomEmail] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState("");

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes", trackId],
    queryFn: () => academicsApi.fetchClasses(Number(trackId)),
    enabled: !!trackId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      academicsApi.createClass({
        track_id: Number(trackId),
        name,
        school_year: schoolYear,
        homeroom_teacher_email: homeroomEmail || undefined,
        capacity: capacity ? Number(capacity) : undefined,
      }),
    onSuccess: (schoolClass) => {
      queryClient.setQueryData<SchoolClass[] | undefined>(["classes", trackId], (prev) =>
        prev ? [...prev, schoolClass] : [schoolClass]
      );
      setName("");
      setSchoolYear("");
      setHomeroomEmail("");
      setCapacity("");
      setError("");
      setAdding(false);
    },
    onError: () => setError("Vérifiez les champs — l'email doit correspondre à un enseignant existant."),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Classes de cette filière, par année scolaire, avec leur enseignant titulaire.
      </Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (
        (classes ?? []).map((schoolClass) => (
          <ClassCard key={schoolClass.id} schoolClass={schoolClass} />
        ))
      )}

      {adding ? (
        <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
          <Input label="Nom de la classe" value={name} onChangeText={setName} placeholder="Terminale D1" />
          <Input
            label="Année scolaire"
            value={schoolYear}
            onChangeText={setSchoolYear}
            placeholder="2025-2026"
          />
          <Input
            label="Email de l'enseignant titulaire (optionnel)"
            value={homeroomEmail}
            onChangeText={setHomeroomEmail}
            placeholder="prof@exemple.ci"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Effectif maximum (optionnel)"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
            placeholder="40"
          />
          {error ? <Text className="text-xs text-xporadia-red">{error}</Text> : null}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Créer"
                pill
                disabled={!name || !schoolYear}
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
          accessibilityLabel="Ajouter une classe"
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5"
        >
          <PlusIcon size={16} />
          <Text className="text-white font-semibold">Ajouter une classe</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
