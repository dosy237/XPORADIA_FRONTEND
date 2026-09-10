import { router } from "expo-router";
import { Text, View } from "react-native";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { BriefcaseIcon, BuildingIcon, FileTextIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function CompanyDashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <View className="flex-1 bg-xporadia-bg">
      <DashboardHeader title="Espace entreprise" subtitle={user ? `${user.first_name} ${user.last_name}` : undefined} />
      <View className="p-6 gap-3">
        <Card onPress={() => router.push("/(app)/company/internship-offers")} className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-full bg-xporadia-orange/10 items-center justify-center">
            <BriefcaseIcon size={20} color={Colors.orange} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Offres de stage</Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Publiez des offres et gérez les candidatures reçues des établissements.
            </Text>
          </View>
        </Card>

        <Card onPress={() => router.push("/(app)/internship-convention")} className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
            <FileTextIcon size={20} color={Colors.navy} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Conventions de stage</Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Signature, journal de stage et évaluation des stagiaires accueillis.
            </Text>
          </View>
        </Card>

        <Card onPress={() => router.push("/(app)/company/profile")} className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
            <BuildingIcon size={20} color={Colors.navy} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Mon entreprise</Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Raison sociale, secteur, branding de vos conventions PDF.
            </Text>
          </View>
        </Card>
      </View>
    </View>
  );
}
