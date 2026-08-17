import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { ClockIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";

const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const TODAY_INDEX = (new Date().getDay() + 6) % 7;

export default function TimetableScreen() {
  const [selectedDay, setSelectedDay] = useState(Math.min(TODAY_INDEX, 5));
  const { data: timetable, isLoading } = useQuery({
    queryKey: ["my-timetable"],
    queryFn: academicsApi.fetchMyTimetable,
  });

  const slots = (timetable ?? [])
    .filter((s) => s.weekday === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <View className="flex-1 bg-xporadia-bg">
      <View className="px-6 pt-6 pb-2 gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Emploi du temps</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Touchez un créneau passé pour retrouver vos notes de révision.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-6 gap-2 py-3">
        {WEEKDAYS.map((label, index) => (
          <Pressable
            key={label}
            onPress={() => setSelectedDay(index)}
            className={`px-4 py-2.5 rounded-full ${
              selectedDay === index ? "bg-xporadia-navy" : "bg-white"
            } ${selectedDay !== index ? "shadow-soft" : ""}`}
          >
            <Text className={`text-xs font-semibold ${selectedDay === index ? "text-white" : "text-xporadia-text-secondary"}`}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerClassName="px-6 gap-3 pb-12">
        {isLoading ? (
          <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : slots.length > 0 ? (
          slots.map((slot) => (
            <Card
              key={slot.id}
              onPress={() => router.push(`/(app)/student/notes?subject=${slot.subject}`)}
              className="flex-row items-center gap-3"
            >
              <View className="items-center w-14">
                <Text className="text-sm font-bold text-xporadia-navy">{slot.start_time.slice(0, 5)}</Text>
                <Text className="text-[10px] text-xporadia-text-secondary">{slot.end_time.slice(0, 5)}</Text>
              </View>
              <View className="w-px h-10 bg-xporadia-border" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">{slot.subject_name}</Text>
                {slot.room ? <Text className="text-xs text-xporadia-text-secondary">{slot.room}</Text> : null}
              </View>
              <ClockIcon size={16} color={Colors.textSecondary} />
            </Card>
          ))
        ) : (
          <View className="items-center gap-2 py-10">
            <ClockIcon size={24} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">Aucun cours ce jour-là.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
