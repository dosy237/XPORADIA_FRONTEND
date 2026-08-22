import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { DelegatesManager } from "@/components/academics/DelegatesManager";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PencilIcon, PlusIcon, UsersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { SchoolClass } from "@/services/academics";

function ClassCard({ schoolClass, trackId }: { schoolClass: SchoolClass; trackId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [homeroomEmail, setHomeroomEmail] = useState(schoolClass.homeroom_teacher?.email ?? "");
  const [error, setError] = useState("");

  const updateMutation = useMutation({
    mutationFn: () => academicsApi.updateClass(schoolClass.id, { homeroom_teacher_email: homeroomEmail || undefined }),
    onSuccess: (updated) => {
      queryClient.setQueryData<SchoolClass[] | undefined>(["classes", trackId], (prev) =>
        prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev
      );
      setError("");
      setEditing(false);
    },
    onError: () => setError("Aucun enseignant actif ne correspond à cet email."),
  });

  if (editing) {
    return (
      <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
        <Text className="text-sm font-semibold text-xporadia-text-primary">{schoolClass.name}</Text>
        <Input
          label="Email du nouveau titulaire"
          value={homeroomEmail}
          onChangeText={setHomeroomEmail}
          placeholder="prof@exemple.ci"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {error ? <Text className="text-xs text-xporadia-red">{error}</Text> : null}
        <Text className="text-[11px] text-xporadia-text-secondary">
          Le nouveau titulaire est notifié et reçoit les droits d&apos;administration du canal de classe ;
          l&apos;ancien titulaire les perd automatiquement.
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label="Annuler" variant="secondary" pill onPress={() => setEditing(false)} />
          </View>
          <View className="flex-1">
            <Button
              label="Enregistrer"
              pill
              loading={updateMutation.isPending}
              onPress={() => updateMutation.mutate()}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(app)/class-roster/[classId]",
            params: {
              classId: String(schoolClass.id),
              className: schoolClass.name,
              schoolYear: schoolClass.school_year,
            },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Gérer les effectifs de ${schoolClass.name}`}
        className="gap-2"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-xporadia-text-primary">{schoolClass.name}</Text>
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
        <Text className="text-xs font-semibold text-xporadia-orange">Gérer les effectifs →</Text>
      </Pressable>
      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={() => setEditing(true)}
          accessibilityRole="button"
          accessibilityLabel={`Changer le titulaire de ${schoolClass.name}`}
          className="flex-row items-center gap-1.5 self-start"
          hitSlop={8}
        >
          <PencilIcon size={12} color={Colors.navy} />
          <Text className="text-[11px] font-medium text-xporadia-navy">Changer de titulaire</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(app)/teacher/report-cards/[classId]",
              params: { classId: String(schoolClass.id) },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Voir les bulletins de ${schoolClass.name}`}
          className="self-start"
          hitSlop={8}
        >
          <Text className="text-[11px] font-medium text-xporadia-orange">Voir les bulletins</Text>
        </Pressable>
      </View>
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

  const { data: track } = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => academicsApi.fetchTrack(Number(trackId)),
    enabled: !!trackId,
  });

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
    onError: () => setError("Vérifiez les champs : l'email doit correspondre à un enseignant existant."),
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
          <ClassCard key={schoolClass.id} schoolClass={schoolClass} trackId={String(trackId)} />
        ))
      )}

      {adding ? (
        <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
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
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5 shadow-deep-orange"
        >
          <PlusIcon size={16} />
          <Text className="text-white font-semibold">Ajouter une classe</Text>
        </Pressable>
      )}

      {track ? (
        <DelegatesManager
          title="Délégation de la création de classes"
          helperText="Un enseignant délégué peut créer des classes dans cette filière uniquement — jamais une autre filière."
          delegates={track.class_delegates}
          queryKeyToInvalidate={["track", trackId]}
          onAdd={(email) => academicsApi.addTrackDelegate(Number(trackId), email)}
          onRemove={(email) => academicsApi.removeTrackDelegate(Number(trackId), email)}
        />
      ) : null}
    </ScrollView>
  );
}
