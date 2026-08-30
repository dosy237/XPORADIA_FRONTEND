import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { DateStrip, MONTH_LABELS, WEEKDAY_LABELS, todayISO, weekdayOfISO } from "@/components/academics/DateStrip";
import { CalendarIcon, CheckCircleIcon, ClockIcon, PinIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { TeacherAttendanceSlot } from "@/services/academics";

/** Bornée aux heures d'ouverture de l'établissement (6h-20h) plutôt que
 * minuit à minuit : un enseignant n'a jamais de cours hors de cette plage,
 * et l'agenda élève (dont celui-ci reprend le principe visuel) n'a besoin
 * de couvrir 24h que pour les créneaux personnels — absents ici. */
const OPEN_HOUR = 6;
const CLOSE_HOUR = 20;
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
const HOUR_HEIGHT = 64;

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
  return ((timeToMinutes(t) - OPEN_HOUR * 60) / 60) * HOUR_HEIGHT;
}

function heightFor(start: string, end: string) {
  return Math.max(((timeToMinutes(end) - timeToMinutes(start)) / 60) * HOUR_HEIGHT, 30);
}

/** Une teinte cohérente par classe (pas par matière : deux classes
 * peuvent partager le même nom de matière) — dérivée de l'identifiant de
 * classe pour rester stable d'un jour à l'autre sans stockage. */
const SLOT_PALETTE = [Colors.navy, Colors.orange, Colors.purple, Colors.gold, Colors.green];
function colorForClass(classId: number) {
  return SLOT_PALETTE[classId % SLOT_PALETTE.length];
}

interface PositionedSlot {
  slot: TeacherAttendanceSlot;
  column: number;
  columnCount: number;
}

/** Deux classes peuvent parfaitement être programmées au même horaire pour
 * ce professeur (chevauchement réel, pas une erreur de saisie à corriger
 * ici) — sans ce partage en colonnes côte à côte, leurs blocs se
 * superposent exactement et deviennent illisibles (texte mélangé). Regroupe
 * les créneaux qui se chevauchent en composantes connexes, puis attribue à
 * chacun la colonne la plus à gauche encore libre au sein de son groupe. */
function layoutSlots(slots: TeacherAttendanceSlot[]): PositionedSlot[] {
  const items = slots
    .map((slot) => ({ slot, start: timeToMinutes(slot.start_time), end: timeToMinutes(slot.end_time) }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const n = items.length;
  const parent = items.map((_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (items[i].start < items[j].end && items[j].start < items[i].end) {
        const ri = find(i);
        const rj = find(j);
        if (ri !== rj) parent[ri] = rj;
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  const columnOf = new Array(n).fill(0);
  const columnCountOf = new Array(n).fill(1);
  for (const indices of groups.values()) {
    indices.sort((a, b) => items[a].start - items[b].start);
    const active: { end: number; column: number }[] = [];
    let maxColumn = 0;
    for (const idx of indices) {
      for (let k = active.length - 1; k >= 0; k--) {
        if (active[k].end <= items[idx].start) active.splice(k, 1);
      }
      const usedColumns = new Set(active.map((a) => a.column));
      let column = 0;
      while (usedColumns.has(column)) column++;
      columnOf[idx] = column;
      maxColumn = Math.max(maxColumn, column);
      active.push({ end: items[idx].end, column });
    }
    for (const idx of indices) columnCountOf[idx] = maxColumn + 1;
  }

  return items.map((item, i) => ({ slot: item.slot, column: columnOf[i], columnCount: columnCountOf[i] }));
}

function SlotCard({
  slot,
  column,
  columnCount,
  date,
}: {
  slot: TeacherAttendanceSlot;
  column: number;
  columnCount: number;
  date: string;
}) {
  const color = colorForClass(slot.school_class);
  const widthPercent = 100 / columnCount;
  const attendanceTaken = slot.attendance_taken ?? false;
  return (
    <View
      style={{
        position: "absolute",
        top: topFor(slot.start_time),
        height: heightFor(slot.start_time, slot.end_time),
        left: `${column * widthPercent}%`,
        width: `${widthPercent}%`,
        paddingHorizontal: 3,
      }}
    >
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(app)/teacher/subject/[subjectId]",
            params: { subjectId: String(slot.subject) },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`${slot.subject_name}, ${slot.school_class_name}, de ${slot.start_time.slice(0, 5)} à ${slot.end_time.slice(0, 5)}`}
        style={{ flex: 1, borderRadius: 14, overflow: "hidden", flexDirection: "row" }}
      >
        <View style={{ width: 4, backgroundColor: color }} />
        <LinearGradient
          colors={[withAlpha(color, 0.14), withAlpha(color, 0.03)]}
          style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 8, justifyContent: "center", gap: 2 }}
        >
          <Text className="text-sm font-bold text-xporadia-navy" numberOfLines={2}>
            {slot.subject_name}
          </Text>
          <Text className="text-xs font-semibold" style={{ color }}>
            {slot.school_class_name}
          </Text>
          <View className="flex-row items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            <View className="flex-row items-center gap-1">
              <ClockIcon size={11} color={Colors.textSecondary} />
              <Text className="text-[11px] text-xporadia-text-secondary">
                {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
              </Text>
            </View>
            {slot.room ? (
              <View className="flex-row items-center gap-1">
                <PinIcon size={11} color={Colors.textSecondary} />
                <Text className="text-[11px] text-xporadia-text-secondary" numberOfLines={1}>
                  {slot.room}
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </Pressable>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(app)/teacher/attendance/[slotId]",
            params: {
              slotId: String(slot.id),
              date,
              subjectName: slot.subject_name,
              className: slot.school_class_name,
            },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={attendanceTaken ? "Appel déjà fait, voir/modifier" : "Faire l'appel"}
        hitSlop={4}
        style={{
          position: "absolute",
          top: 5,
          right: 6,
          height: 22,
          width: 22,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: attendanceTaken ? withAlpha(Colors.green, 0.16) : withAlpha(Colors.navy, 0.08),
        }}
      >
        <CheckCircleIcon size={13} color={attendanceTaken ? Colors.green : Colors.textSecondary} />
      </Pressable>
    </View>
  );
}

export default function TeacherAgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const { data: agenda, isLoading } = useQuery({
    queryKey: ["my-attendance-overview", selectedDate],
    queryFn: () => academicsApi.fetchMyAttendanceOverview(selectedDate),
  });

  const slots = agenda?.slots ?? [];
  const positionedSlots = useMemo(() => layoutSlots(slots), [slots]);
  const dateObj = new Date(`${selectedDate}T00:00:00`);
  const dateLabel = `${WEEKDAY_LABELS[weekdayOfISO(selectedDate)]} ${dateObj.getDate()} ${MONTH_LABELS[dateObj.getMonth()]}`;
  const isToday = selectedDate === todayISO();

  return (
    <View className="flex-1 bg-xporadia-bg">
      <View className="px-6 pt-6 pb-2 gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Mon agenda</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Vos cours du jour, toutes classes confondues.
        </Text>
      </View>

      <View className="pt-2 pb-1">
        <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
      </View>

      <View className="px-6 pt-2 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1 mr-2">
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

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-10">Chargement...</Text>
      ) : agenda && !agenda.is_school_day ? (
        <View className="px-6">
          <LinearGradient
            colors={[withAlpha(Colors.navy, 0.07), withAlpha(Colors.navy, 0.02)]}
            style={{ paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <ClockIcon size={14} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary flex-1">
              Pas de cours ce jour-là dans aucune de vos classes (vacances ou weekend).
            </Text>
          </LinearGradient>
        </View>
      ) : slots.length === 0 ? (
        <View className="px-6">
          <LinearGradient
            colors={[withAlpha(Colors.orange, 0.1), withAlpha(Colors.orange, 0.02)]}
            style={{ paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <ClockIcon size={14} color={Colors.orange} />
            <Text className="text-xs text-xporadia-text-secondary flex-1">
              Aucun de vos cours ce jour-là, mais l&apos;établissement fonctionne normalement.
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-6 pb-16">
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: 44 }}>
              {HOURS.map((h) => (
                <View key={h} style={{ height: HOUR_HEIGHT }}>
                  <Text className="text-[10px] text-xporadia-text-secondary">{h}h</Text>
                </View>
              ))}
            </View>

            <View style={{ flex: 1, position: "relative", height: HOURS.length * HOUR_HEIGHT }}>
              {HOURS.map((h) => (
                <View
                  key={h}
                  style={{ position: "absolute", top: (h - OPEN_HOUR) * HOUR_HEIGHT, left: 0, right: 0, borderTopWidth: 1, borderTopColor: Colors.border }}
                />
              ))}
              {positionedSlots.map(({ slot, column, columnCount }) => (
                <SlotCard key={slot.id} slot={slot} column={column} columnCount={columnCount} date={selectedDate} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
