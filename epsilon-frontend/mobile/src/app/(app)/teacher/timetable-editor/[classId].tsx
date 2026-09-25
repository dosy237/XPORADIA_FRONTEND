import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ClockIcon, PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { TimetableSlot } from "@/services/academics";

const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function SlotRow({ slot, onDelete }: { slot: TimetableSlot; onDelete: (id: number) => void }) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3">
      <View className="items-center w-14">
        <Text className="text-sm font-bold text-xporadia-navy">{slot.start_time.slice(0, 5)}</Text>
        <Text className="text-[10px] text-xporadia-text-secondary">{slot.end_time.slice(0, 5)}</Text>
      </View>
      <View className="w-px h-9 bg-xporadia-border" />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-xporadia-text-primary">{slot.subject_name}</Text>
        {slot.room ? <Text className="text-xs text-xporadia-text-secondary">{slot.room}</Text> : null}
      </View>
      <Pressable
        onPress={() =>
          Alert.alert("Supprimer ce créneau", `${slot.subject_name}, ${slot.start_time.slice(0, 5)}`, [
            { text: "Annuler", style: "cancel" },
            { text: "Supprimer", style: "destructive", onPress: () => onDelete(slot.id) },
          ])
        }
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Supprimer le créneau de ${slot.subject_name}`}
      >
        <TrashIcon size={16} color={Colors.red} />
      </Pressable>
    </View>
  );
}

export default function TimetableEditorScreen() {
  const { classId, className } = useLocalSearchParams<{ classId: string; className?: string }>();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(0);
  const [adding, setAdding] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");

  const timetableQueryKey = ["timetable", classId];
  const { data: slots, isLoading } = useQuery({
    queryKey: timetableQueryKey,
    queryFn: () => academicsApi.fetchTimetable(Number(classId)),
    enabled: !!classId,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", classId],
    queryFn: () => academicsApi.fetchSubjects(Number(classId)),
    enabled: !!classId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      academicsApi.createTimetableSlot(Number(classId), {
        subject: Number(subjectId),
        weekday: selectedDay,
        start_time: startTime,
        end_time: endTime,
        room: room || undefined,
      }),
    onSuccess: (slot) => {
      queryClient.setQueryData<TimetableSlot[] | undefined>(timetableQueryKey, (prev) =>
        prev ? [...prev, slot] : [slot]
      );
      setSubjectId("");
      setStartTime("");
      setEndTime("");
      setRoom("");
      setAdding(false);
    },
    onError: () => Alert.alert("Erreur", "Vérifiez les horaires (l'heure de fin doit être après le début)."),
  });

  const deleteMutation = useMutation({
    mutationFn: (slotId: number) => academicsApi.deleteTimetableSlot(slotId),
    onSuccess: (_data, slotId) => {
      queryClient.setQueryData<TimetableSlot[] | undefined>(timetableQueryKey, (prev) =>
        prev ? prev.filter((s) => s.id !== slotId) : prev
      );
    },
  });

  const daySlots = (slots ?? [])
    .filter((s) => s.weekday === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <View className="flex-1 bg-xporadia-bg">
      <View className="px-6 pt-6 pb-2 gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Emploi du temps</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          {className ? `${className} — ` : ""}visible par les élèves et leurs parents dès l&apos;ajout.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-6 gap-2 py-3">
        {WEEKDAYS.map((label, index) => (
          <Pressable
            key={label}
            onPress={() => setSelectedDay(index)}
            className={`px-4 py-2.5 rounded-full ${
              selectedDay === index ? "bg-xporadia-navy" : "bg-white shadow-soft"
            }`}
          >
            <Text className={`text-xs font-semibold ${selectedDay === index ? "text-white" : "text-xporadia-text-secondary"}`}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerClassName="px-6 gap-3 pb-12">
        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : daySlots.length > 0 ? (
          daySlots.map((slot) => (
            <SlotRow key={slot.id} slot={slot} onDelete={(id) => deleteMutation.mutate(id)} />
          ))
        ) : (
          <View className="items-center gap-2 py-8">
            <ClockIcon size={22} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">Aucun cours ce jour-là.</Text>
          </View>
        )}

        {adding ? (
          <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
              Nouveau créneau — {WEEKDAYS[selectedDay]}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(subjects ?? []).map((subject) => (
                <Chip
                  key={subject.id}
                  label={subject.name}
                  variant={subjectId === String(subject.id) ? "navy" : "neutral"}
                  onPress={() => setSubjectId(String(subject.id))}
                />
              ))}
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input label="Début" value={startTime} onChangeText={setStartTime} placeholder="08:00" />
              </View>
              <View className="flex-1">
                <Input label="Fin" value={endTime} onChangeText={setEndTime} placeholder="09:00" />
              </View>
            </View>
            <Input label="Salle (optionnel)" value={room} onChangeText={setRoom} placeholder="Salle 12" />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
              </View>
              <View className="flex-1">
                <Button
                  label="Ajouter"
                  pill
                  disabled={!subjectId || !startTime || !endTime}
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
            accessibilityLabel="Ajouter un créneau"
            className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5 shadow-deep-orange"
          >
            <PlusIcon size={16} />
            <Text className="text-white font-semibold">Ajouter un créneau</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
