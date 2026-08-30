import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import {
  DateStrip,
  MONTH_LABELS,
  WEEKDAY_LABELS,
  pad,
  todayISO,
  weekdayOfISO,
} from "@/components/academics/DateStrip";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CalendarIcon, ClockIcon, PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { AgendaPersonalBlock, EstablishmentEvent, OccurrenceScope, TimetableSlot } from "@/services/academics";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 56;

/** Mélange une couleur hex avec une opacité — pour des remplissages en
 * dégradé "matière et lumière" plutôt que des aplats francs. */
function withAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function topFor(t: string) {
  return (timeToMinutes(t) / 60) * HOUR_HEIGHT;
}

function heightFor(start: string, end: string) {
  return Math.max(((timeToMinutes(end) - timeToMinutes(start)) / 60) * HOUR_HEIGHT, 22);
}

function isValidTime(t: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

interface BlockFormState {
  title: string;
  subjectId: string;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM: BlockFormState = { title: "", subjectId: "", startTime: "", endTime: "" };

function BlockFormSheet({
  visible,
  heading,
  form,
  subjects,
  onChange,
  onCancel,
  onSubmit,
  submitLabel,
  loading,
  onDelete,
  deleteLoading,
}: {
  visible: boolean;
  heading: string;
  form: BlockFormState;
  subjects: { id: number; name: string }[];
  onChange: (form: BlockFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  loading: boolean;
  onDelete?: () => void;
  deleteLoading?: boolean;
}) {
  if (!visible) return null;
  const canSubmit = form.title.trim().length > 0 && isValidTime(form.startTime) && isValidTime(form.endTime) &&
    timeToMinutes(form.startTime) < timeToMinutes(form.endTime);

  return (
    <KeyboardAvoidingView
      className="absolute inset-0"
      style={{ zIndex: 30 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable className="flex-1 bg-black/30 items-center justify-center px-6" onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full p-5 gap-3" style={{ maxWidth: 400 }}>
          <Text className="text-base font-bold text-xporadia-navy">{heading}</Text>

        <View className="gap-1">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Titre</Text>
          <TextInput
            value={form.title}
            onChangeText={(v) => onChange({ ...form, title: v })}
            placeholder="Révision de maths"
            className="bg-xporadia-bg rounded-xl px-4 py-3 text-sm text-xporadia-text-primary"
          />
        </View>

        {subjects.length > 0 ? (
          <View className="gap-1">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Matière (optionnel)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1">
              <Chip
                label="Aucune"
                variant={form.subjectId === "" ? "navy" : "neutral"}
                onPress={() => onChange({ ...form, subjectId: "" })}
              />
              {subjects.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  variant={form.subjectId === String(s.id) ? "navy" : "neutral"}
                  onPress={() => onChange({ ...form, subjectId: String(s.id) })}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="flex-row gap-2">
          <View className="flex-1 gap-1">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Début</Text>
            <TextInput
              value={form.startTime}
              onChangeText={(v) => onChange({ ...form, startTime: v })}
              placeholder="18:00"
              className="bg-xporadia-bg rounded-xl px-4 py-3 text-sm text-xporadia-text-primary"
            />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Fin</Text>
            <TextInput
              value={form.endTime}
              onChangeText={(v) => onChange({ ...form, endTime: v })}
              placeholder="19:00"
              className="bg-xporadia-bg rounded-xl px-4 py-3 text-sm text-xporadia-text-primary"
            />
          </View>
        </View>

        {onDelete ? (
          <Pressable
            onPress={onDelete}
            disabled={deleteLoading}
            className="flex-row items-center justify-center gap-2 py-2"
            accessibilityRole="button"
            accessibilityLabel="Supprimer ce créneau"
          >
            <TrashIcon size={14} color={Colors.red} />
            <Text className="text-xs font-semibold" style={{ color: Colors.red }}>Supprimer ce créneau</Text>
          </Pressable>
        ) : null}

        <View className="flex-row gap-3 mt-1">
          <View className="flex-1">
            <Button label="Annuler" variant="secondary" pill onPress={onCancel} />
          </View>
          <View className="flex-1">
            <Button label={submitLabel} pill disabled={!canSubmit} loading={loading} onPress={onSubmit} />
          </View>
        </View>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

/** Choix explicite et obligatoire entre modifier UNE occurrence ou "cette
 * date et les suivantes" — jamais de valeur par défaut assumée, exactement
 * comme le demande la tâche (comportement des agendas grand public). */
function ScopeChoiceSheet({
  visible,
  actionLabel,
  onCancel,
  onChoose,
  loading,
}: {
  visible: boolean;
  actionLabel: string;
  onCancel: () => void;
  onChoose: (scope: OccurrenceScope) => void;
  loading: boolean;
}) {
  if (!visible) return null;
  return (
    <Pressable className="absolute inset-0 bg-black/30 items-center justify-center px-6" style={{ zIndex: 40 }} onPress={onCancel}>
      <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full p-5 gap-3" style={{ maxWidth: 380 }}>
        <Text className="text-base font-bold text-xporadia-navy">{actionLabel}</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Ce créneau se répète chaque semaine. Que voulez-vous faire ?
        </Text>
        <View className="gap-2 mt-1">
          <Pressable
            onPress={() => onChoose("this")}
            disabled={loading}
            className="bg-xporadia-bg rounded-2xl p-4"
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-xporadia-text-primary">Cette date uniquement</Text>
            <Text className="text-xs text-xporadia-text-secondary mt-0.5">Les autres semaines ne changent pas.</Text>
          </Pressable>
          <Pressable
            onPress={() => onChoose("following")}
            disabled={loading}
            className="bg-xporadia-bg rounded-2xl p-4"
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-xporadia-text-primary">Cette date et les suivantes</Text>
            <Text className="text-xs text-xporadia-text-secondary mt-0.5">Les dates passées gardent l'ancienne valeur.</Text>
          </Pressable>
        </View>
        <View className="mt-1">
          <Button label="Annuler" variant="secondary" pill onPress={onCancel} disabled={loading} />
        </View>
      </Pressable>
    </Pressable>
  );
}

export default function AgendaScreen() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const { data: agenda, isLoading } = useQuery({
    queryKey: ["my-agenda", selectedDate],
    queryFn: () => academicsApi.fetchMyAgenda(selectedDate),
  });

  const { data: myClass } = useQuery({
    queryKey: ["my-class-for-agenda"],
    queryFn: academicsApi.fetchMyClass,
  });
  const subjects = useMemo(() => (myClass?.subjects ?? []).map((s) => ({ id: s.id, name: s.name })), [myClass]);

  const [createSheet, setCreateSheet] = useState<{ visible: boolean; startTime: string } | null>(null);
  const [createForm, setCreateForm] = useState<BlockFormState>(EMPTY_FORM);

  const [editSheet, setEditSheet] = useState<{ visible: boolean; block: AgendaPersonalBlock } | null>(null);
  const [editForm, setEditForm] = useState<BlockFormState>(EMPTY_FORM);

  const [scopeSheet, setScopeSheet] = useState<{ visible: boolean; action: "save" | "delete" } | null>(null);

  const invalidateAgenda = () => queryClient.invalidateQueries({ queryKey: ["my-agenda", selectedDate] });

  const createMutation = useMutation({
    mutationFn: () =>
      academicsApi.createPersonalBlock({
        weekday: weekdayOfISO(selectedDate),
        start_time: createForm.startTime,
        end_time: createForm.endTime,
        title: createForm.title.trim(),
        subject: createForm.subjectId ? Number(createForm.subjectId) : undefined,
        valid_from: selectedDate,
      }),
    onSuccess: () => {
      invalidateAgenda();
      setCreateSheet(null);
      setCreateForm(EMPTY_FORM);
    },
  });

  const editMutation = useMutation({
    mutationFn: (scope: OccurrenceScope) =>
      academicsApi.editPersonalBlockOccurrence(editSheet!.block.block, {
        scope,
        date: selectedDate,
        title: editForm.title.trim(),
        subject: editForm.subjectId ? Number(editForm.subjectId) : undefined,
        start_time: editForm.startTime,
        end_time: editForm.endTime,
      }),
    onSuccess: () => {
      invalidateAgenda();
      setScopeSheet(null);
      setEditSheet(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (scope: OccurrenceScope) =>
      academicsApi.deletePersonalBlockOccurrence(editSheet!.block.block, scope, selectedDate),
    onSuccess: () => {
      invalidateAgenda();
      setScopeSheet(null);
      setEditSheet(null);
    },
  });

  const officialSlots: TimetableSlot[] = agenda?.official_slots ?? [];
  const personalBlocks: AgendaPersonalBlock[] = agenda?.personal_blocks ?? [];
  const schoolEvents: EstablishmentEvent[] = agenda?.school_events ?? [];
  const untimedEvents = schoolEvents.filter((e) => !e.start_time);
  // Un cours annulé partage exactement l'horaire du créneau officiel qu'il
  // annule (voir apps.academics.views.TeacherAbsenceDeclarationView) — le
  // signaler à part plutôt que comme un événement de plus au même endroit
  // évite que les deux blocs se superposent visuellement.
  const cancelledClassEvents = schoolEvents.filter((e) => e.event_type === "cancelled_class");
  const timedEvents = schoolEvents.filter((e) => !!e.start_time && e.event_type !== "cancelled_class");
  const holidayEvent = untimedEvents.find((e) => e.event_type === "holiday");
  const otherUntimedEvents = untimedEvents.filter((e) => e.event_type !== "holiday");

  function cancelledReasonFor(slot: TimetableSlot) {
    return cancelledClassEvents.find(
      (e) => e.title === slot.subject_name && e.start_time === slot.start_time && e.end_time === slot.end_time,
    );
  }

  const dateObj = new Date(`${selectedDate}T00:00:00`);
  const dateLabel = `${WEEKDAY_LABELS[weekdayOfISO(selectedDate)]} ${dateObj.getDate()} ${MONTH_LABELS[dateObj.getMonth()]}`;
  const isToday = selectedDate === todayISO();

  return (
    <View className="flex-1 bg-xporadia-bg">
      <View className="px-6 pt-6 pb-2 gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Agenda</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Cours officiels et créneaux personnels, jour par jour.
        </Text>
      </View>

      <View className="pt-2 pb-1">
        <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
      </View>

      <View className="px-6 pt-2 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <CalendarIcon size={14} color={Colors.textSecondary} />
          <Text className="text-sm font-semibold text-xporadia-navy" numberOfLines={1}>
            {isToday ? `Aujourd'hui, ${dateLabel}` : dateLabel}
          </Text>
        </View>
        {!isToday ? (
          <Pressable
            onPress={() => setSelectedDate(todayISO())}
            accessibilityRole="button"
            accessibilityLabel="Revenir à aujourd'hui"
            className="px-3 py-1.5 rounded-full bg-xporadia-navy/[0.06]"
          >
            <Text className="text-xs font-semibold text-xporadia-navy">Aujourd&apos;hui</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="px-6 pb-2 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <LinearGradient
            colors={[withAlpha(Colors.navy, 0.4), withAlpha(Colors.navy, 0.1)]}
            style={{ height: 12, width: 12, borderRadius: 4 }}
          />
          <Text className="text-[11px] text-xporadia-text-secondary">Cours officiels</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <LinearGradient
            colors={[withAlpha(Colors.orange, 0.55), withAlpha(Colors.orange, 0.15)]}
            style={{ height: 12, width: 12, borderRadius: 4 }}
          />
          <Text className="text-[11px] text-xporadia-text-secondary">Mes créneaux</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <LinearGradient
            colors={[withAlpha(Colors.purple, 0.45), withAlpha(Colors.purple, 0.12)]}
            style={{ height: 12, width: 12, borderRadius: 4 }}
          />
          <Text className="text-[11px] text-xporadia-text-secondary">Événements</Text>
        </View>
      </View>

      {agenda && !agenda.is_school_day ? (
        <LinearGradient
          colors={[withAlpha(Colors.navy, 0.07), withAlpha(Colors.navy, 0.02)]}
          style={{ marginHorizontal: 24, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <ClockIcon size={14} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary flex-1">
            Pas de cours officiel ce jour-là (vacances ou weekend).
          </Text>
        </LinearGradient>
      ) : null}

      {holidayEvent ? (
        <LinearGradient
          colors={[withAlpha(Colors.gold, 0.28), withAlpha(Colors.gold, 0.08)]}
          style={{ marginHorizontal: 24, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: withAlpha(Colors.gold, 0.55), flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <CalendarIcon size={14} color={Colors.gold} />
          <Text className="text-xs font-semibold flex-1" style={{ color: Colors.bronze }}>
            Jour férié, {holidayEvent.title}. Pas de cours officiel aujourd&apos;hui.
          </Text>
        </LinearGradient>
      ) : null}

      {otherUntimedEvents.map((event) => (
        <LinearGradient
          key={event.id}
          colors={[withAlpha(Colors.purple, 0.16), withAlpha(Colors.purple, 0.04)]}
          style={{ marginHorizontal: 24, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: withAlpha(Colors.purple, 0.4), flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <CalendarIcon size={14} color={Colors.purple} />
          <View className="flex-1">
            <Text className="text-xs font-semibold" style={{ color: Colors.purple }}>
              {event.event_type_label} : {event.title}
            </Text>
            {event.description ? (
              <Text className="text-[11px] text-xporadia-text-secondary mt-0.5">{event.description}</Text>
            ) : null}
          </View>
        </LinearGradient>
      ))}

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-10">Chargement...</Text>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-6 pb-16">
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: 40 }}>
              {HOURS.map((h) => (
                <View key={h} style={{ height: HOUR_HEIGHT }}>
                  <Text className="text-[10px] text-xporadia-text-secondary">{pad(h)}:00</Text>
                </View>
              ))}
            </View>

            <View style={{ flex: 1, position: "relative", height: 24 * HOUR_HEIGHT }}>
              {HOURS.map((h) => (
                <View
                  key={h}
                  style={{ position: "absolute", top: h * HOUR_HEIGHT, left: 0, right: 0, borderTopWidth: 1, borderTopColor: Colors.border }}
                />
              ))}

              {timedEvents.map((event) => (
                <View
                  key={event.id}
                  style={{ position: "absolute", top: topFor(event.start_time as string), height: heightFor(event.start_time as string, event.end_time || event.start_time as string), left: 2, right: 2, zIndex: 5, borderRadius: 8, overflow: "hidden", flexDirection: "row" }}
                >
                  <View style={{ width: 3, backgroundColor: Colors.purple }} />
                  <LinearGradient
                    colors={[withAlpha(Colors.purple, 0.18), withAlpha(Colors.purple, 0.05)]}
                    style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 4, justifyContent: "center" }}
                  >
                    <Text numberOfLines={1} className="text-[10px] font-semibold" style={{ color: Colors.purple }}>
                      {event.event_type_label} : {event.title}
                    </Text>
                    <Text className="text-[9px] text-xporadia-text-secondary">
                      {event.start_time!.slice(0, 5)}{event.end_time ? `-${event.end_time.slice(0, 5)}` : ""}
                    </Text>
                  </LinearGradient>
                </View>
              ))}

              <View style={{ flexDirection: "row", height: 24 * HOUR_HEIGHT }}>
                <View style={{ flex: 1, position: "relative" }}>
                  {officialSlots.map((slot) => {
                    const cancelledEvent = cancelledReasonFor(slot);
                    return (
                      <View
                        key={slot.id}
                        style={{
                          position: "absolute",
                          top: topFor(slot.start_time),
                          height: heightFor(slot.start_time, slot.end_time),
                          left: 2,
                          right: 4,
                          borderRadius: 8,
                          overflow: "hidden",
                          flexDirection: "row",
                          opacity: cancelledEvent ? 0.6 : 1,
                        }}
                      >
                        <View style={{ width: 3, backgroundColor: cancelledEvent ? Colors.red : Colors.navy }} />
                        <LinearGradient
                          colors={
                            cancelledEvent
                              ? [withAlpha(Colors.red, 0.1), withAlpha(Colors.red, 0.02)]
                              : [withAlpha(Colors.navy, 0.14), withAlpha(Colors.navy, 0.04)]
                          }
                          style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 4, justifyContent: "center" }}
                        >
                          <Text
                            numberOfLines={1}
                            className="text-[10px] font-semibold text-xporadia-navy"
                            style={cancelledEvent ? { textDecorationLine: "line-through" } : undefined}
                          >
                            {slot.subject_name}
                          </Text>
                          {cancelledEvent ? (
                            <Text className="text-[9px] font-semibold" style={{ color: Colors.red }} numberOfLines={1}>
                              Cours annulé
                            </Text>
                          ) : (
                            <Text className="text-[9px] text-xporadia-text-secondary">
                              {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                            </Text>
                          )}
                        </LinearGradient>
                      </View>
                    );
                  })}
                </View>

                <View style={{ flex: 1, position: "relative" }}>
                  {HOURS.map((h) => (
                    <Pressable
                      key={h}
                      style={{ position: "absolute", top: h * HOUR_HEIGHT, left: 0, right: 0, height: HOUR_HEIGHT }}
                      onPress={() => {
                        setCreateForm({ ...EMPTY_FORM, startTime: `${pad(h)}:00`, endTime: `${pad(h + 1 > 23 ? 23 : h + 1)}:00` });
                        setCreateSheet({ visible: true, startTime: `${pad(h)}:00` });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Ajouter un créneau personnel à ${pad(h)}:00`}
                    />
                  ))}
                  {personalBlocks.map((block) => (
                    <Pressable
                      key={`${block.block}-${block.exception ?? "base"}`}
                      style={{ position: "absolute", top: topFor(block.start_time), height: heightFor(block.start_time, block.end_time), left: 4, right: 2, borderRadius: 8, overflow: "hidden", flexDirection: "row" }}
                      onPress={() => {
                        setEditForm({
                          title: block.title,
                          subjectId: block.subject ? String(block.subject) : "",
                          startTime: block.start_time.slice(0, 5),
                          endTime: block.end_time.slice(0, 5),
                        });
                        setEditSheet({ visible: true, block });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Modifier le créneau ${block.title}`}
                    >
                      <View style={{ width: 3, backgroundColor: Colors.orange }} />
                      <LinearGradient
                        colors={[withAlpha(Colors.orange, 0.22), withAlpha(Colors.orange, 0.06)]}
                        style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 4, justifyContent: "center" }}
                      >
                        <Text numberOfLines={1} className="text-[10px] font-semibold text-xporadia-navy">
                          {block.title}
                        </Text>
                        <Text className="text-[9px] text-xporadia-text-secondary">
                          {block.start_time.slice(0, 5)}-{block.end_time.slice(0, 5)}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      <View className="absolute bottom-6 right-6">
        <Pressable
          onPress={() => {
            setCreateForm(EMPTY_FORM);
            setCreateSheet({ visible: true, startTime: "" });
          }}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un créneau personnel"
          className="h-14 w-14 rounded-full bg-xporadia-orange items-center justify-center shadow-deep-orange"
        >
          <PlusIcon size={20} />
        </Pressable>
      </View>

      <BlockFormSheet
        visible={!!createSheet?.visible}
        heading="Nouveau créneau personnel"
        form={createForm}
        subjects={subjects}
        onChange={setCreateForm}
        onCancel={() => setCreateSheet(null)}
        onSubmit={() => createMutation.mutate()}
        submitLabel="Ajouter"
        loading={createMutation.isPending}
      />

      <BlockFormSheet
        visible={!!editSheet?.visible}
        heading="Modifier ce créneau"
        form={editForm}
        subjects={subjects}
        onChange={setEditForm}
        onCancel={() => setEditSheet(null)}
        onSubmit={() => setScopeSheet({ visible: true, action: "save" })}
        submitLabel="Enregistrer"
        loading={false}
        onDelete={() => setScopeSheet({ visible: true, action: "delete" })}
      />

      <ScopeChoiceSheet
        visible={!!scopeSheet?.visible}
        actionLabel={scopeSheet?.action === "delete" ? "Supprimer ce créneau" : "Enregistrer les modifications"}
        onCancel={() => setScopeSheet(null)}
        loading={editMutation.isPending || deleteMutation.isPending}
        onChoose={(scope) => {
          if (scopeSheet?.action === "delete") {
            deleteMutation.mutate(scope);
          } else {
            editMutation.mutate(scope);
          }
        }}
      />
    </View>
  );
}
