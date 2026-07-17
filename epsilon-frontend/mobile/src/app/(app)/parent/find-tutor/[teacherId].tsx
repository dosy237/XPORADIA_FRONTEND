import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import * as directoryApi from "@/services/teacherDirectory";
import * as tutoringApi from "@/services/tutoring";
import type { MobileOperator, SessionMode } from "@/services/tutoring";

const MODE_LABELS: Record<SessionMode, string> = {
  home: "À domicile",
  teacher: "Chez l'enseignant",
  online: "En ligne",
};

const OPERATOR_LABELS: Record<MobileOperator, string> = {
  orange: "Orange Money",
  wave: "Wave",
  mtn: "MTN MoMo",
};

function ChipPicker<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          className={`rounded-full border px-4 py-2 ${
            value === option ? "bg-xporadia-navy border-xporadia-navy" : "bg-white border-xporadia-border"
          }`}
        >
          <Text className={`text-sm ${value === option ? "text-white font-semibold" : "text-xporadia-text-primary"}`}>
            {labels[option]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function BookTutorScreen() {
  const { teacherId } = useLocalSearchParams<{ teacherId: string }>();
  const id = Number(teacherId);

  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher-directory-detail", id],
    queryFn: () => directoryApi.fetchTeacherDirectoryDetail(id),
    enabled: !!id,
  });

  const [childName, setChildName] = useState("");
  const [childLevel, setChildLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [operator, setOperator] = useState<MobileOperator | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const bookMutation = useMutation({
    mutationFn: () =>
      tutoringApi.bookTutoringSession({
        teacher_id: id,
        child_name: childName,
        child_level: childLevel,
        subject,
        mode: mode!,
        date,
        start_time: startTime,
        duration_min: Number(duration) || 60,
        address,
        note_for_teacher: note,
        operator: operator!,
        phone_number: phoneNumber,
      }),
    onSuccess: () => {
      router.replace("/(app)/parent/my-tutoring-sessions");
    },
  });

  if (isLoading || !teacher) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  const canSubmit =
    childName && childLevel && subject && mode && date && startTime && operator && phoneNumber;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="bg-white rounded-2xl p-4 border border-xporadia-border flex-row items-center gap-3">
        <Avatar firstName={teacher.first_name} lastName={teacher.last_name} size={52} />
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-xporadia-text-primary">
            {teacher.first_name} {teacher.last_name}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Chip
              label={teacher.current_level ? LEVEL_LABELS[teacher.current_level] : "Non certifié"}
              variant="navy-subtle"
            />
            {teacher.hourly_rate && (
              <Chip label={`${Number(teacher.hourly_rate).toLocaleString("fr-FR")} FCFA/h`} variant="orange" />
            )}
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-3">
        <Text className="text-sm font-semibold text-xporadia-text-primary">Réserver une séance</Text>
        <Input label="Prénom de l'enfant" value={childName} onChangeText={setChildName} />
        <Input label="Classe" value={childLevel} onChangeText={setChildLevel} placeholder="CM2, 5ème, ..." />
        <Input label="Matière" value={subject} onChangeText={setSubject} placeholder="Mathématiques" />

        <Text className="text-xs font-semibold text-xporadia-text-secondary">Lieu</Text>
        <ChipPicker options={["home", "teacher", "online"]} labels={MODE_LABELS} value={mode} onChange={setMode} />

        <Input label="Date" value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" />
        <Input label="Heure de début" value={startTime} onChangeText={setStartTime} placeholder="16:00" />
        <Input label="Durée (minutes)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
        {mode === "home" && (
          <Input label="Adresse" value={address} onChangeText={setAddress} placeholder="Cocody, Abidjan" />
        )}
        <Input
          label="Note pour l'enseignant (optionnel)"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
          style={{ height: 60, textAlignVertical: "top" }}
        />
      </View>

      <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-3">
        <Text className="text-sm font-semibold text-xporadia-text-primary">Paiement Mobile Money</Text>
        <ChipPicker
          options={["orange", "wave", "mtn"]}
          labels={OPERATOR_LABELS}
          value={operator}
          onChange={setOperator}
        />
        <Input label="Numéro de téléphone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
        {teacher.hourly_rate && (
          <Text className="text-xs text-xporadia-text-secondary">
            Montant séquestré à la réservation : {Number(teacher.hourly_rate).toLocaleString("fr-FR")} FCFA
          </Text>
        )}
      </View>

      {bookMutation.isError && (
        <Text className="text-xs text-xporadia-red text-center">
          Une erreur est survenue lors de la réservation. Vérifiez les informations saisies.
        </Text>
      )}

      <Button
        label="Réserver et payer"
        pill
        disabled={!canSubmit}
        loading={bookMutation.isPending}
        onPress={() => bookMutation.mutate()}
      />
    </ScrollView>
  );
}
