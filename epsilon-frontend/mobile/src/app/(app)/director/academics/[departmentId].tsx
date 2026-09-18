import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { DelegatesManager } from "@/components/academics/DelegatesManager";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import * as academicsApi from "@/services/academics";
import type { Track } from "@/services/academics";

function TrackCard({ track }: { track: Track }) {
  return (
    <Pressable
      onPress={() => router.push(`/(app)/director/academics/track/${track.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Voir la filière ${track.name}`}
      className="bg-white rounded-2xl p-4 shadow-soft"
    >
      <Text className="text-base font-semibold text-xporadia-text-primary">{track.name}</Text>
      {track.description ? (
        <Text className="text-xs text-xporadia-text-secondary mt-0.5" numberOfLines={2}>
          {track.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function DepartmentTracksScreen() {
  const { departmentId } = useLocalSearchParams<{ departmentId: string }>();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: department } = useQuery({
    queryKey: ["department", departmentId],
    queryFn: () => academicsApi.fetchDepartment(Number(departmentId)),
    enabled: !!departmentId,
  });

  const { data: tracks, isLoading } = useQuery({
    queryKey: ["tracks", departmentId],
    queryFn: () => academicsApi.fetchTracks(Number(departmentId)),
    enabled: !!departmentId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      academicsApi.createTrack({ department_id: Number(departmentId), name, description }),
    onSuccess: (track) => {
      queryClient.setQueryData<Track[] | undefined>(["tracks", departmentId], (prev) =>
        prev ? [...prev, track] : [track]
      );
      setName("");
      setDescription("");
      setAdding(false);
    },
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Filières de ce département. Chacune contiendra ses propres classes.
      </Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (
        (tracks ?? []).map((track) => <TrackCard key={track.id} track={track} />)
      )}

      {adding ? (
        <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
          <Input label="Nom de la filière" value={name} onChangeText={setName} placeholder="Scientifique" />
          <Input
            label="Description (optionnel)"
            value={description}
            onChangeText={setDescription}
            placeholder="Séries C, D"
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
          accessibilityLabel="Ajouter une filière"
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5 shadow-deep-orange"
        >
          <PlusIcon size={16} />
          <Text className="text-white font-semibold">Ajouter une filière</Text>
        </Pressable>
      )}

      {department ? (
        <DelegatesManager
          title="Délégation de la création de filières"
          helperText="Un enseignant délégué peut créer des filières dans ce département uniquement — jamais un autre département, jamais de nouveau département."
          delegates={department.track_delegates}
          queryKeyToInvalidate={["department", departmentId]}
          onAdd={(email) => academicsApi.addDepartmentDelegate(Number(departmentId), email)}
          onRemove={(email) => academicsApi.removeDepartmentDelegate(Number(departmentId), email)}
        />
      ) : null}
    </ScrollView>
  );
}
