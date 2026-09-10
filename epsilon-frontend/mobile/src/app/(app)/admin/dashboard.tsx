import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  BookIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  MedalIcon,
  UserPlusIcon,
  UsersIcon,
  WarningIcon,
} from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as adminApi from "@/services/adminPanel";
import { useAuthStore } from "@/store/authStore";

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: adminApi.fetchDashboardStats,
  });

  return (
    <View className="flex-1 bg-xporadia-bg">
      <DashboardHeader title="Espace administrateur" subtitle={user ? `${user.first_name} ${user.last_name}` : undefined} />
      <ScrollView contentContainerClassName="p-6 gap-5 pb-12">
        <View className="bg-xporadia-navy rounded-2xl p-5 flex-row justify-between">
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-white">
              {stats?.today_payments_total.toLocaleString("fr-FR") ?? "..."}
            </Text>
            <Text className="text-[10px] text-white/60 uppercase text-center mt-1">
              FCFA reçus aujourd&apos;hui
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Card onPress={() => router.push("/(app)/admin/accreditation")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-orange/10 items-center justify-center">
              <CheckCircleIcon size={20} color={Colors.orange} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Accréditations</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Comptes en attente de validation présentielle.
              </Text>
            </View>
            {!!stats?.pending_accreditation && <Chip label={String(stats.pending_accreditation)} variant="orange" />}
          </Card>

          <Card onPress={() => router.push("/(app)/admin/library-moderation")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
              <BookIcon size={20} color={Colors.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Bibliothèque</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Contributions en attente de modération.
              </Text>
            </View>
            {!!stats?.pending_library && <Chip label={String(stats.pending_library)} variant="orange" />}
          </Card>

          <Card onPress={() => router.push("/(app)/admin/disputes")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-red/10 items-center justify-center">
              <WarningIcon size={20} color={Colors.red} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Litiges</Text>
              <Text className="text-xs text-xporadia-text-secondary">Paiements contestés à traiter.</Text>
            </View>
            {!!stats?.open_disputes && <Chip label={String(stats.open_disputes)} variant="orange" />}
          </Card>

          <Card onPress={() => router.push("/(app)/admin/users")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
              <UsersIcon size={20} color={Colors.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Comptes utilisateurs</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Élèves, enseignants, établissements, entreprises.
              </Text>
            </View>
          </Card>

          <Card onPress={() => router.push("/(app)/admin/administrators")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
              <UserPlusIcon size={20} color={Colors.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Administrateurs</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Qui a accès, en ajouter un nouveau.
              </Text>
            </View>
          </Card>

          <Card onPress={() => router.push("/(app)/admin/certification-modules")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
              <MedalIcon size={20} color={Colors.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Modules de formation</Text>
              <Text className="text-xs text-xporadia-text-secondary">Publier et gérer le catalogue.</Text>
            </View>
          </Card>

          <Card onPress={() => router.push("/(app)/admin/job-listings")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
              <BriefcaseIcon size={20} color={Colors.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Offres d&apos;emploi</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Toutes les offres, tous établissements confondus.
              </Text>
            </View>
          </Card>

          <Card onPress={() => router.push("/(app)/admin/internship-offers")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
              <BriefcaseIcon size={20} color={Colors.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Offres de stage</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Toutes les offres, toutes entreprises confondues.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
