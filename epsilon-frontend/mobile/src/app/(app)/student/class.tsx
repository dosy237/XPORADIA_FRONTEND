import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";

export default function StudentClassScreen() {
  const { data: myClass, isLoading } = useQuery({ queryKey: ["my-class"], queryFn: academicsApi.fetchMyClass });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!myClass?.school_class_name) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-8">
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Vous n'êtes inscrit dans aucune classe pour le moment.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">{myClass.school_class_name}</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          {myClass.classmates.length + 1} élève{myClass.classmates.length !== 0 ? "s" : ""}
        </Text>
      </View>

      {myClass.homeroom_teacher && (
        <Card className="flex-row items-center gap-3">
          <Avatar
            firstName={myClass.homeroom_teacher.first_name}
            lastName={myClass.homeroom_teacher.last_name}
            size={48}
          />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">
              {myClass.homeroom_teacher.first_name} {myClass.homeroom_teacher.last_name}
            </Text>
            <Text className="text-xs text-xporadia-text-secondary">Professeur principal</Text>
          </View>
          <Button
            label="Message"
            variant="secondary"
            pill
            onPress={() => router.push("/(app)/messages")}
          />
        </Card>
      )}

      <View className="gap-3">
        <Text className="text-base font-bold text-xporadia-navy">Mes camarades</Text>
        {myClass.classmates.length > 0 ? (
          <View className="gap-2">
            {myClass.classmates.map((c) => (
              <Card key={c.id} variant="flat" className="flex-row items-center gap-3 bg-white">
                <Avatar firstName={c.first_name} lastName={c.last_name} size={40} />
                <Text className="text-sm font-medium text-xporadia-text-primary">
                  {c.first_name} {c.last_name}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <View className="items-center gap-2 py-8">
            <UsersIcon size={24} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">Aucun autre élève inscrit pour l'instant.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
