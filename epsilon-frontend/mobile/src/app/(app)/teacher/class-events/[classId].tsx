import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CalendarIcon, PlusIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { EventAudience, EventType, EstablishmentEvent } from "@/services/academics";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "report_card_distribution", label: "Remise de bulletins" },
  { value: "meeting", label: "Réunion" },
  { value: "holiday", label: "Jour férié" },
  { value: "other", label: "Autre" },
];

const AUDIENCES: { value: EventAudience; label: string }[] = [
  { value: "students", label: "Élèves" },
  { value: "parents", label: "Parents" },
  { value: "teachers", label: "Équipe enseignante" },
];

function defaultAudienceFor(type: EventType): EventAudience[] {
  if (type === "meeting") return ["teachers"];
  if (type === "holiday") return ["students", "parents"];
  return ["students", "parents"];
}

function EventCard({ event }: { event: EstablishmentEvent }) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-xporadia-text-primary flex-1" numberOfLines={2}>
          {event.title}
        </Text>
        <Chip label={event.event_type_label} variant="navy-subtle" />
      </View>
      <View className="flex-row items-center gap-2">
        <CalendarIcon size={13} color={Colors.textSecondary} />
        <Text className="text-xs text-xporadia-text-secondary">
          {event.date}
          {event.start_time ? ` · ${event.start_time.slice(0, 5)}${event.end_time ? `-${event.end_time.slice(0, 5)}` : ""}` : ""}
          {event.school_class ? "" : " · toute l'école"}
        </Text>
      </View>
      {event.description ? (
        <Text className="text-xs text-xporadia-text-secondary leading-4">{event.description}</Text>
      ) : null}
      <View className="flex-row flex-wrap gap-1.5 mt-0.5">
        {event.audience.map((a) => (
          <Chip key={a} label={AUDIENCES.find((x) => x.value === a)?.label ?? a} variant="orange" />
        ))}
      </View>
    </View>
  );
}

export default function ClassEventsScreen() {
  const { classId, className } = useLocalSearchParams<{ classId: string; className?: string }>();
  const queryClient = useQueryClient();
  const queryKey = ["class-events", classId];

  const { data: events, isLoading } = useQuery({
    queryKey,
    queryFn: () => academicsApi.fetchClassEvents(Number(classId)),
    enabled: !!classId,
  });

  const [adding, setAdding] = useState(false);
  const [eventType, setEventType] = useState<EventType>("meeting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [forWholeEstablishment, setForWholeEstablishment] = useState(false);
  const [audience, setAudience] = useState<EventAudience[]>(defaultAudienceFor("meeting"));

  const resetForm = () => {
    setEventType("meeting");
    setTitle("");
    setDescription("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setForWholeEstablishment(false);
    setAudience(defaultAudienceFor("meeting"));
  };

  const createMutation = useMutation({
    mutationFn: () =>
      academicsApi.createClassEvent(Number(classId), {
        event_type: eventType,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        audience,
        for_whole_establishment: forWholeEstablishment,
      }),
    onSuccess: (event) => {
      queryClient.setQueryData<EstablishmentEvent[] | undefined>(queryKey, (prev) =>
        prev ? [...prev, event] : [event]
      );
      resetForm();
      setAdding(false);
    },
  });

  const toggleAudience = (value: EventAudience) => {
    setAudience((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]));
  };

  const isDateValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const canSubmit = title.trim().length > 0 && isDateValid && audience.length > 0;

  const sorted = [...(events ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <View className="flex-1 bg-xporadia-bg">
      <Stack.Screen options={{ title: "Événements" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-4 pb-16">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-xporadia-navy">Événements</Text>
          <Text className="text-sm text-xporadia-text-secondary">
            {className ? `${className}, ` : ""}remises de bulletins, réunions et jours fériés, visibles dans
            l&apos;agenda des personnes concernées.
          </Text>
        </View>

        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : sorted.length === 0 ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">
            Aucun événement pour l&apos;instant.
          </Text>
        ) : (
          <View className="gap-3">
            {sorted.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {adding ? (
          <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Nouvel événement</Text>

            <View className="flex-row flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  variant={eventType === t.value ? "navy" : "neutral"}
                  onPress={() => {
                    setEventType(t.value);
                    setAudience(defaultAudienceFor(t.value));
                  }}
                />
              ))}
            </View>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Titre (ex : Réunion parents-enseignants)"
              className="bg-xporadia-bg rounded-xl px-4 py-3 text-sm text-xporadia-text-primary"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optionnel)"
              multiline
              numberOfLines={2}
              className="bg-xporadia-bg rounded-xl px-4 py-3 text-sm text-xporadia-text-primary"
              style={{ height: 58, textAlignVertical: "top" }}
            />

            <View className="flex-row gap-2">
              <View className="flex-1 gap-1">
                <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Date</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-04-15"
                  className="bg-xporadia-bg rounded-xl px-4 py-3 text-sm text-xporadia-text-primary"
                />
              </View>
            </View>

            {eventType !== "holiday" ? (
              <View className="flex-row gap-2">
                <View className="flex-1 gap-1">
                  <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Début (optionnel)</Text>
                  <TextInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="17:00"
                    className="bg-xporadia-bg rounded-xl px-4 py-3 text-sm text-xporadia-text-primary"
                  />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Fin (optionnel)</Text>
                  <TextInput
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="18:00"
                    className="bg-xporadia-bg rounded-xl px-4 py-3 text-sm text-xporadia-text-primary"
                  />
                </View>
              </View>
            ) : null}

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Public cible</Text>
              <View className="flex-row flex-wrap gap-2">
                {AUDIENCES.map((a) => (
                  <Chip
                    key={a.value}
                    label={a.label}
                    variant={audience.includes(a.value) ? "navy" : "neutral"}
                    onPress={() => toggleAudience(a.value)}
                  />
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => setForWholeEstablishment((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Étendre à tout l'établissement"
              className="flex-row items-center gap-2"
            >
              <View
                className={`h-5 w-5 rounded-md border items-center justify-center ${
                  forWholeEstablishment ? "bg-xporadia-navy border-xporadia-navy" : "border-xporadia-border"
                }`}
              >
                {forWholeEstablishment ? <View className="h-2.5 w-2.5 rounded-sm bg-white" /> : null}
              </View>
              <Text className="text-xs text-xporadia-text-primary flex-1">
                Concerne tout l&apos;établissement (pas seulement cette classe)
              </Text>
            </Pressable>

            <View className="flex-row gap-3 mt-1">
              <View className="flex-1">
                <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
              </View>
              <View className="flex-1">
                <Button
                  label="Créer"
                  pill
                  disabled={!canSubmit}
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
            accessibilityLabel="Ajouter un événement"
            className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5 shadow-deep-orange"
          >
            <PlusIcon size={16} />
            <Text className="text-white font-semibold">Ajouter un événement</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
