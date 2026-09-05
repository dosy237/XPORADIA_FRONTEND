import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { todayISO } from "@/components/academics/DateStrip";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CalendarXIcon, CheckCircleIcon, ClockIcon, CloseIcon, ShieldCheckIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { AttendanceExceptionInput, AttendanceStatus } from "@/services/academics";

const STATUS_OPTIONS: { value: AttendanceStatus | "present"; label: string; icon: typeof CheckCircleIcon; color: string }[] = [
  { value: "present", label: "Présent", icon: CheckCircleIcon, color: Colors.green },
  { value: "absent", label: "Absent", icon: CloseIcon, color: Colors.red },
  { value: "late", label: "En retard", icon: ClockIcon, color: Colors.gold },
  { value: "excused", label: "Excusé", icon: ShieldCheckIcon, color: Colors.purple },
];

function withAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

interface RowState {
  status: AttendanceStatus | null;
  reason: string;
}

function StudentRow({
  child,
  firstName,
  lastName,
  avatar,
  state,
  onChange,
}: {
  child: number;
  firstName: string;
  lastName: string;
  avatar: string | null;
  state: RowState;
  onChange: (next: RowState) => void;
}) {
  return (
    <View className="bg-white rounded-2xl p-3 gap-2.5 shadow-soft">
      <View className="flex-row items-center gap-3">
        <Avatar firstName={firstName} lastName={lastName} imageUri={avatar} size={36} />
        <Text className="flex-1 text-sm font-semibold text-xporadia-text-primary" numberOfLines={2}>
          {firstName} {lastName}
        </Text>
      </View>
      <View className="flex-row justify-end gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = opt.value === "present" ? state.status === null : state.status === opt.value;
          const Icon = opt.icon;
          return (
            <Pressable
              key={opt.value}
              onPress={() =>
                onChange(opt.value === "present" ? { status: null, reason: "" } : { status: opt.value, reason: state.reason })
              }
              accessibilityRole="button"
              accessibilityLabel={`${firstName} ${lastName} : marquer ${opt.label.toLowerCase()}`}
              hitSlop={4}
              style={{
                height: 30,
                width: 30,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive ? withAlpha(opt.color, 0.16) : Colors.bg,
                borderWidth: isActive ? 1 : 0,
                borderColor: withAlpha(opt.color, 0.4),
              }}
            >
              <Icon size={14} color={isActive ? opt.color : Colors.textSecondary} />
            </Pressable>
          );
        })}
      </View>
      {state.status ? (
        <TextInput
          value={state.reason}
          onChangeText={(reason) => onChange({ status: state.status, reason })}
          placeholder="Motif (optionnel)"
          className="bg-xporadia-bg rounded-xl px-3 py-2 text-xs text-xporadia-text-primary"
        />
      ) : null}
    </View>
  );
}

export default function SlotAttendanceScreen() {
  const { slotId, date: dateParam, subjectName, className } = useLocalSearchParams<{
    slotId: string;
    date?: string;
    subjectName?: string;
    className?: string;
  }>();
  const date = dateParam || todayISO();
  const numericSlotId = Number(slotId);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["slot-attendance", numericSlotId, date],
    queryFn: () => academicsApi.fetchSlotAttendance(numericSlotId, date),
  });

  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [declaring, setDeclaring] = useState(false);
  const [absenceReason, setAbsenceReason] = useState("");

  useEffect(() => {
    if (!data) return;
    const initial: Record<number, RowState> = {};
    for (const entry of data.roster) {
      initial[entry.child] = { status: entry.status, reason: entry.reason };
    }
    setRows(initial);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => {
      const exceptions: AttendanceExceptionInput[] = Object.entries(rows)
        .filter(([, state]) => state.status !== null)
        .map(([childId, state]) => ({
          child: Number(childId),
          status: state.status as AttendanceStatus,
          reason: state.reason,
        }));
      return academicsApi.saveSlotAttendance(numericSlotId, date, exceptions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slot-attendance", numericSlotId, date] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance-overview"] });
      router.back();
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer l'appel pour le moment."),
  });

  const invalidateAfterAbsenceChange = () => {
    queryClient.invalidateQueries({ queryKey: ["slot-attendance", numericSlotId, date] });
    queryClient.invalidateQueries({ queryKey: ["my-attendance-overview"] });
  };

  const declareAbsenceMutation = useMutation({
    mutationFn: () => academicsApi.declareTeacherAbsence(numericSlotId, date, absenceReason.trim()),
    onSuccess: () => {
      setDeclaring(false);
      setAbsenceReason("");
      invalidateAfterAbsenceChange();
    },
    onError: () => Alert.alert("Erreur", "Impossible de déclarer cette absence pour le moment."),
  });

  const revokeAbsenceMutation = useMutation({
    mutationFn: () => academicsApi.revokeTeacherAbsence(numericSlotId, date),
    onSuccess: invalidateAfterAbsenceChange,
    onError: () => Alert.alert("Erreur", "Impossible d'annuler cette déclaration pour le moment."),
  });

  const roster = data?.roster ?? [];
  const absentCount = Object.values(rows).filter((r) => r.status === "absent").length;
  const lateCount = Object.values(rows).filter((r) => r.status === "late").length;
  const excusedCount = Object.values(rows).filter((r) => r.status === "excused").length;

  return (
    <View className="flex-1 bg-xporadia-bg">
      <Stack.Screen options={{ title: "Faire l'appel" }} />
      <View className="px-6 pt-6 pb-3 gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy" numberOfLines={2}>
          {subjectName ?? "Appel"}
        </Text>
        <Text className="text-sm text-xporadia-text-secondary" numberOfLines={1}>
          {className ? `${className} · ` : ""}
          {date}
        </Text>
        {data?.taken && !data?.cancelled ? (
          <Text className="text-xs text-xporadia-text-secondary mt-1">
            Appel déjà fait par {data.taken_by}.
          </Text>
        ) : null}
      </View>

      {!isLoading && data?.cancelled ? (
        <View className="px-6 pb-4 gap-3">
          <View
            className="rounded-2xl p-4 gap-2"
            style={{ backgroundColor: withAlpha(Colors.red, 0.08), borderWidth: 1, borderColor: withAlpha(Colors.red, 0.25) }}
          >
            <View className="flex-row items-center gap-2">
              <CalendarXIcon size={16} color={Colors.red} />
              <Text className="text-sm font-bold" style={{ color: Colors.red }}>
                Cours annulé
              </Text>
            </View>
            <Text className="text-xs text-xporadia-text-secondary">
              Vous avez déclaré ne pas tenir ce cours à cette date. Les élèves, leurs parents, le titulaire et la
              direction ont été prévenus.
            </Text>
            {data.cancelled_reason ? (
              <Text className="text-xs text-xporadia-text-primary">Motif : {data.cancelled_reason}</Text>
            ) : null}
          </View>
          <Button
            label="Finalement, j'assure ce cours"
            variant="secondary"
            pill
            loading={revokeAbsenceMutation.isPending}
            onPress={() => revokeAbsenceMutation.mutate()}
          />
        </View>
      ) : null}

      {!isLoading && !data?.cancelled ? (
        <View className="px-6 pb-3 gap-3">
          {!declaring ? (
            <Pressable
              onPress={() => setDeclaring(true)}
              accessibilityRole="button"
              accessibilityLabel="Déclarer que vous ne tiendrez pas ce cours"
              className="flex-row items-center gap-2 self-start"
              hitSlop={4}
            >
              <CalendarXIcon size={13} color={Colors.textSecondary} />
              <Text className="text-xs font-semibold text-xporadia-text-secondary">
                Je n&apos;assurerai pas ce cours
              </Text>
            </Pressable>
          ) : (
            <View
              className="rounded-2xl p-4 gap-2.5"
              style={{ backgroundColor: withAlpha(Colors.navy, 0.04), borderWidth: 1, borderColor: Colors.border }}
            >
              <Text className="text-xs font-semibold text-xporadia-navy">
                Déclarer une absence pour ce cours, le {date}
              </Text>
              <TextInput
                value={absenceReason}
                onChangeText={setAbsenceReason}
                placeholder="Motif (optionnel)"
                className="bg-white rounded-xl px-3 py-2 text-xs text-xporadia-text-primary"
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label="Confirmer l'absence"
                    pill
                    loading={declareAbsenceMutation.isPending}
                    onPress={() => declareAbsenceMutation.mutate()}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Annuler"
                    variant="secondary"
                    pill
                    onPress={() => {
                      setDeclaring(false);
                      setAbsenceReason("");
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      ) : null}

      {!isLoading && !data?.cancelled && roster.length > 0 ? (
        <View className="px-6 pb-3 flex-row items-center gap-3">
          <Text className="text-xs font-semibold" style={{ color: Colors.red }}>
            {absentCount} absent{absentCount > 1 ? "s" : ""}
          </Text>
          <Text className="text-xs font-semibold" style={{ color: Colors.gold }}>
            {lateCount} en retard
          </Text>
          <Text className="text-xs font-semibold" style={{ color: Colors.purple }}>
            {excusedCount} excusé{excusedCount > 1 ? "s" : ""}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-10">Chargement...</Text>
      ) : data?.cancelled ? null : (
        <ScrollView className="flex-1" contentContainerClassName="px-6 gap-2 pb-28">
          {roster.map((entry) => (
            <StudentRow
              key={entry.child}
              child={entry.child}
              firstName={entry.first_name}
              lastName={entry.last_name}
              avatar={entry.avatar}
              state={rows[entry.child] ?? { status: entry.status, reason: entry.reason }}
              onChange={(next) => setRows((prev) => ({ ...prev, [entry.child]: next }))}
            />
          ))}
        </ScrollView>
      )}

      {!data?.cancelled ? (
        <View className="absolute bottom-0 left-0 right-0 bg-xporadia-bg px-6 pt-3 pb-6 border-t border-xporadia-border">
          <Button
            label="Enregistrer l'appel"
            pill
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          />
        </View>
      ) : null}
    </View>
  );
}
