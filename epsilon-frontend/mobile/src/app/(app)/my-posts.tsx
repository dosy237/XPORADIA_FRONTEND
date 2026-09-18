import { ScrollView, Text, View } from "react-native";

import { AuthorPostsList } from "@/components/feed/AuthorPostsList";
import { useAuthStore } from "@/store/authStore";

export default function MyPostsScreen() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Mes publications</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Tout ce que vous avez partagé sur le fil d&apos;actualité.
        </Text>
      </View>
      <AuthorPostsList authorId={user.id} />
    </ScrollView>
  );
}
