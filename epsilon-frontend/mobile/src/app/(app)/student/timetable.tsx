import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { AgendaPersonalBlock, OccurrenceScope, TimetableSlot } from "@/services/academics";

const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTH_LABELS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 56;

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDaysISO(iso: string, delta: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function weekdayOfISO(iso: string) {
  // Date.getDay() : dimanche=0..samedi=6 -> on veut lundi=0..dimanche=6
  const jsDay = new Date(`${iso}T00:00:00`).getDay();
  return (jsDay + 6) % 7;
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
    <Pressable className="absolute inset-0 bg-black/30 items-center justify-center px-6" style={{ zIndex: 30 }} onPress={onCancel}>
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

      <View className="px-6 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => setSelectedDate((d) => addDaysISO(d, -1))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Jour précédent"
          className="h-10 w-10 rounded-full bg-white shadow-soft items-center justify-center"
        >
          <ChevronLeftIcon size={18} color={Colors.navy} />
        </Pressable>

        <Pressable
          onPress={() => setSelectedDate(todayISO())}
          className="flex-1 items-center flex-row justify-center gap-2"
          accessibilityRole="button"
          accessibilityLabel="Revenir à aujourd'hui"
        >
          <CalendarIcon size={14} color={Colors.textSecondary} />
          <Text className="text-sm font-semibold text-xporadia-navy text-center" numberOfLines={1}>
            {isToday ? `Aujourd'hui, ${dateLabel}` : dateLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedDate((d) => addDaysISO(d, 1))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Jour suivant"
          className="h-10 w-10 rounded-full bg-white shadow-soft items-center justify-center"
        >
          <ChevronRightIcon size={18} color={Colors.navy} />
        </Pressable>
      </View>

      <View className="px-6 pb-2 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-3 w-3 rounded-sm bg-xporadia-navy/[0.15] border border-xporadia-navy/40" />
          <Text className="text-[11px] text-xporadia-text-secondary">Cours officiels</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-3 w-3 rounded-sm bg-xporadia-orange/[0.15] border border-xporadia-orange" />
          <Text className="text-[11px] text-xporadia-text-secondary">Mes créneaux</Text>
        </View>
      </View>

      {agenda && !agenda.is_school_day ? (
        <View className="mx-6 mb-2 px-4 py-2.5 rounded-xl bg-xporadia-navy/[0.05] flex-row items-center gap-2">
          <ClockIcon size={14} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary flex-1">
            Pas de cours officiel ce jour-là (vacances ou weekend).
          </Text>
        </View>
      ) : null}

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

              <View style={{ flexDirection: "row", height: 24 * HOUR_HEIGHT }}>
                <View style={{ flex: 1, position: "relative" }}>
                  {officialSlots.map((slot) => (
                    <View
                      key={slot.id}
                      style={{ position: "absolute", top: topFor(slot.start_time), height: heightFor(slot.start_time, slot.end_time), left: 2, right: 4 }}
                      className="bg-xporadia-navy/[0.1] border border-xporadia-navy/40 rounded-lg px-2 py-1"
                    >
                      <Text numberOfLines={1} className="text-[10px] font-semibold text-xporadia-navy">
                        {slot.subject_name}
                      </Text>
                      <Text className="text-[9px] text-xporadia-text-secondary">
                        {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                      </Text>
                    </View>
                  ))}
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
                      style={{ position: "absolute", top: topFor(block.start_time), height: heightFor(block.start_time, block.end_time), left: 4, right: 2 }}
                      className="bg-xporadia-orange/[0.14] border border-xporadia-orange rounded-lg px-2 py-1"
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
                      <Text numberOfLines={1} className="text-[10px] font-semibold text-xporadia-navy">
                        {block.title}
                      </Text>
                      <Text className="text-[9px] text-xporadia-text-secondary">
                        {block.start_time.slice(0, 5)}-{block.end_time.slice(0, 5)}
                      </Text>
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
