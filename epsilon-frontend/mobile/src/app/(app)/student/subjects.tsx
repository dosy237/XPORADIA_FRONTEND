import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BookIcon, MedalIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as messagingApi from "@/services/messaging";
import * as virtualClassesApi from "@/services/virtualClasses";

export default function StudentSubjectsScreen() {
  const { data: subjects, isLoading } = useQuery({
    queryKey: ["my-subjects"],
    queryFn: virtualClassesApi.fetchMySubjects,
  });
  const { data: channels } = useQuery({ queryKey: ["channels"], queryFn: messagingApi.fetchChannels });

  const openSubjectChannel = (subjectName: string) => {
    const channel = channels?.find((c) => c.channel_type === "subject" && c.display_name === subjectName);
    if (channel) {
      router.push(`/(app)/messages/${channel.id}`);
    } else {
      router.push("/(app)/messages");
    }
  };

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Mes matières</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Chaque matière a son canal de discussion, s'il a été créé.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : subjects && subjects.length > 0 ? (
        <View className="gap-3">
          {subjects.map((subject) => {
            const pendingCount = subject.exercises.filter((ex) => !ex.my_submission).length;
            return (
              <Card key={subject.id} onPress={() => openSubjectChannel(subject.name)} className="gap-2">
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
                    <BookIcon size={18} color={Colors.navy} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-xporadia-text-primary">{subject.name}</Text>
                    <Text className="text-xs text-xporadia-text-secondary">{subject.school_class_name}</Text>
                  </View>
                  {pendingCount > 0 && <Chip label={`${pendingCount} à rendre`} variant="orange" />}
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <View className="items-center gap-2 py-10">
          <MedalIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucune matière trouvée pour votre classe.</Text>
        </View>
      )}
    </ScrollView>
  );
}
