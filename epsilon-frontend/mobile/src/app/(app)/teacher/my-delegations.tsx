import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { ComponentType } from "react";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ClockIcon, GraduationCapIcon, UserPlusIcon, LayersIcon, UsersIcon } from "@/components/ui/Icon";
import type { IconProps } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { Department, Track } from "@/services/academics";

const TASK_ROUTES: Record<string, string> = {
  timetable: "/(app)/teacher/timetable-delegation",
  join_requests: "/(app)/director/join-requests",
};

const TASK_ICONS: Record<string, ComponentType<IconProps>> = {
  timetable: ClockIcon,
  join_requests: GraduationCapIcon,
};

function CreateTrackForm({ department, onDone }: { department: Department; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      academicsApi.createTrack({ department_id: department.id, name, description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-delegations"] });
      onDone();
    },
  });

  return (
    <View className="bg-xporadia-bg rounded-xl p-3 gap-2.5 mt-2">
      <Input label="Nom de la filière" value={name} onChangeText={setName} placeholder="Scientifique" />
      <Input
        label="Description (optionnel)"
        value={description}
        onChangeText={setDescription}
        placeholder="Séries C, D"
      />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button label="Annuler" variant="secondary" pill onPress={onDone} />
        </View>
        <View className="flex-1">
          <Button label="Créer" pill disabled={!name} loading={mutation.isPending} onPress={() => mutation.mutate()} />
        </View>
      </View>
    </View>
  );
}

function CreateClassForm({ track, onDone }: { track: Track; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");

  const mutation = useMutation({
    mutationFn: () => academicsApi.createClass({ track_id: track.id, name, school_year: schoolYear }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-delegations"] });
      onDone();
    },
  });

  return (
    <View className="bg-xporadia-bg rounded-xl p-3 gap-2.5 mt-2">
      <Input label="Nom de la classe" value={name} onChangeText={setName} placeholder="Terminale D1" />
      <Input label="Année scolaire" value={schoolYear} onChangeText={setSchoolYear} placeholder="2025-2026" />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button label="Annuler" variant="secondary" pill onPress={onDone} />
        </View>
        <View className="flex-1">
          <Button
            label="Créer"
            pill
            disabled={!name || !schoolYear}
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          />
        </View>
      </View>
    </View>
  );
}

export default function MyDelegationsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-delegations"],
    queryFn: academicsApi.fetchMyDelegations,
  });
  const [creatingTrackIn, setCreatingTrackIn] = useState<number | null>(null);
  const [creatingClassIn, setCreatingClassIn] = useState<number | null>(null);

  const hasAny =
    data &&
    (data.departments_for_tracks.length > 0 || data.tracks_for_classes.length > 0 || data.tasks.length > 0);

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Mes délégations</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Ce que votre établissement vous a confié en plus de vos matières.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !hasAny ? (
        <View className="items-center gap-2 py-10">
          <UserPlusIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary text-center">
            Aucune délégation reçue pour l&apos;instant.
          </Text>
        </View>
      ) : (
        <>
          {data && data.tasks.length > 0 && (
            <View className="gap-3">
              <Text className="text-base font-bold text-xporadia-navy">Tâches confiées</Text>
              {data.tasks.map((t) => {
                const route = TASK_ROUTES[t.task];
                if (!route) return null; // tâche future non encore câblée côté écran — jamais un bouton mort
                const TaskIcon = TASK_ICONS[t.task] ?? ClockIcon;
                return (
                  <Pressable
                    key={t.task}
                    onPress={() => router.push(route as never)}
                    accessibilityRole="button"
                    accessibilityLabel={t.task_label}
                    className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3"
                  >
                    <View className="h-10 w-10 rounded-full bg-xporadia-orange/10 items-center justify-center">
                      <TaskIcon size={16} color={Colors.orange} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-xporadia-text-primary">{t.task_label}</Text>
                      <Text className="text-xs text-xporadia-text-secondary">{t.establishment_name}</Text>
                    </View>
                    <Text className="text-xs font-semibold text-xporadia-orange">Ouvrir →</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {data && data.departments_for_tracks.length > 0 && (
            <View className="gap-3">
              <Text className="text-base font-bold text-xporadia-navy">Créer des filières</Text>
              {data.departments_for_tracks.map((department) => (
                <View key={department.id} className="bg-white rounded-2xl p-4 shadow-soft">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
                      <LayersIcon size={16} color={Colors.navy} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-xporadia-text-primary">{department.name}</Text>
                      <Text className="text-xs text-xporadia-text-secondary">Département</Text>
                    </View>
                    {creatingTrackIn !== department.id && (
                      <Pressable
                        onPress={() => setCreatingTrackIn(department.id)}
                        className="bg-xporadia-orange/10 rounded-full px-3 py-1.5"
                      >
                        <Text className="text-xs font-semibold text-xporadia-orange-text">
                          Nouvelle filière
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {creatingTrackIn === department.id ? (
                    <CreateTrackForm department={department} onDone={() => setCreatingTrackIn(null)} />
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {data && data.tracks_for_classes.length > 0 && (
            <View className="gap-3">
              <Text className="text-base font-bold text-xporadia-navy">Créer des classes</Text>
              {data.tracks_for_classes.map((track) => (
                <View key={track.id} className="bg-white rounded-2xl p-4 shadow-soft">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
                      <UsersIcon size={16} color={Colors.navy} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-xporadia-text-primary">{track.name}</Text>
                      <Text className="text-xs text-xporadia-text-secondary">
                        Filière · {track.department.name}
                      </Text>
                    </View>
                    {creatingClassIn !== track.id && (
                      <Pressable
                        onPress={() => setCreatingClassIn(track.id)}
                        className="bg-xporadia-orange/10 rounded-full px-3 py-1.5"
                      >
                        <Text className="text-xs font-semibold text-xporadia-orange-text">
                          Nouvelle classe
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {creatingClassIn === track.id ? (
                    <CreateClassForm track={track} onDone={() => setCreatingClassIn(null)} />
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
