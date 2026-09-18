import { Linking } from "react-native";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { BriefcaseIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";

// URL de l'application externe dédiée aux cours particuliers — à
// remplacer par la vraie URL une fois l'application partenaire prête.
const TUTORING_APP_URL = "https://tutoring.xporadia.ci";

export default function TutoringTransitionScreen() {
  return (
    <View className="flex-1 bg-xporadia-bg items-center justify-center p-8 gap-5">
      <View className="h-16 w-16 rounded-full bg-xporadia-orange/10 items-center justify-center">
        <BriefcaseIcon size={28} color={Colors.orange} />
      </View>
      <View className="gap-2 items-center">
        <Text className="text-xl font-bold text-xporadia-navy text-center">
          Les cours particuliers, c'est ailleurs
        </Text>
        <Text className="text-sm text-xporadia-text-secondary text-center leading-6">
          La réservation et le suivi des cours particuliers sont désormais gérés par une application
          dédiée, pour une expérience entièrement pensée pour ça.
        </Text>
      </View>
      <Button label="Ouvrir l'application Cours particuliers" pill onPress={() => Linking.openURL(TUTORING_APP_URL)} />
      <Text
        className="text-xs text-xporadia-text-secondary text-center mt-2"
        onPress={() => router.back()}
        suppressHighlighting
      >
        Retour
      </Text>
    </View>
  );
}
