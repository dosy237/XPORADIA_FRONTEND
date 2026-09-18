import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { ClockIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Sélecteur de date+heure — `@react-native-community/datetimepicker` n'a
 * pas d'équivalent web, donc un repli `<input type="datetime-local">` (même
 * mécanisme que le lecteur PDF) sur cette seule plateforme. */
export function DeadlinePicker({ value, onChange }: { value: Date | null; onChange: (date: Date) => void }) {
  const [showPicker, setShowPicker] = useState<"date" | "time" | null>(null);

  if (Platform.OS === "web") {
    return (
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-xporadia-text-secondary">Date limite</Text>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <input
          type="datetime-local"
          value={value ? toLocalInputValue(value) : ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.value) onChange(new Date(event.target.value));
          }}
          style={{
            border: `1px solid ${Colors.border}`,
            borderRadius: 16,
            padding: 12,
            fontSize: 14,
            fontFamily: "inherit",
            color: Colors.textPrimary,
          }}
        />
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-xporadia-text-secondary">Date limite</Text>
      <Pressable
        onPress={() => setShowPicker("date")}
        className="flex-row items-center gap-2 border border-xporadia-border rounded-2xl px-4 py-3"
        accessibilityRole="button"
      >
        <ClockIcon size={14} color={Colors.textSecondary} />
        <Text className="text-sm text-xporadia-text-primary">
          {value
            ? value.toLocaleString("fr-FR", {
                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              })
            : "Choisir une date et une heure"}
        </Text>
      </Pressable>
      {showPicker === "date" ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={(event, selected) => {
            if (Platform.OS === "android") setShowPicker(null);
            if (event.type === "dismissed" || !selected) {
              setShowPicker(null);
              return;
            }
            const merged = new Date(selected);
            if (value) merged.setHours(value.getHours(), value.getMinutes());
            onChange(merged);
            if (Platform.OS === "ios") setShowPicker("time");
          }}
        />
      ) : null}
      {showPicker === "time" ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="time"
          onChange={(event, selected) => {
            setShowPicker(null);
            if (event.type === "dismissed" || !selected) return;
            const merged = new Date(value ?? new Date());
            merged.setHours(selected.getHours(), selected.getMinutes());
            onChange(merged);
          }}
        />
      ) : null}
    </View>
  );
}
