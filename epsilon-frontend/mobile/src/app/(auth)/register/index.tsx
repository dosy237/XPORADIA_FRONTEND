import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Card } from "@/components/ui/Card";

const ROLES = [
  {
    key: "teacher",
    title: "Je suis enseignant",
    description: "Obtenez votre certification et accédez au marché de l'emploi Xporadia.",
    href: "/(auth)/register/teacher" as const,
  },
  {
    key: "director",
    title: "Je suis directeur d'établissement",
    description: "Recrutez des enseignants certifiés et gérez vos stages.",
    href: "/(auth)/register/director" as const,
  },
  {
    key: "parent",
    title: "Je suis parent",
    description: "Trouvez des cours particuliers certifiés pour vos enfants.",
    href: "/(auth)/register/parent" as const,
  },
  {
    key: "company",
    title: "Je représente une entreprise",
    description: "Publiez des offres de stage et évaluez vos stagiaires.",
    href: "/(auth)/register/company" as const,
  },
];

export default function RoleSelectionScreen() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="pb-10">
      <AuthHeader title="Rejoindre Xporadia" subtitle="Quel est votre profil ?" showBack />

      <View className="px-6 gap-3 mt-4">
        {ROLES.map((role) => (
          <Card key={role.key} onPress={() => router.push(role.href)} className="gap-2">
            <Text className="text-lg font-semibold text-xporadia-text-primary">{role.title}</Text>
            <Text className="text-sm text-xporadia-text-secondary">{role.description}</Text>
          </Card>
        ))}

        <View className="items-center mt-2">
          <Text className="text-xporadia-text-secondary" onPress={() => router.back()}>
            J&apos;ai déjà un compte
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
