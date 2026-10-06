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
import { adminHasScope } from "@/lib/adminScope";
import * as adminApi from "@/services/adminPanel";
import { useAuthStore } from "@/store/authStore";
import type { AdminScope } from "@/types/user";

function SectionTitle({ title }: { title: string }) {
  return <Text className="text-base font-bold text-xporadia-navy">{title}</Text>;
}

const GESTION_TILES: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  href: string;
  scope: AdminScope;
}[] = [
  { icon: UsersIcon, label: "Comptes utilisateurs", href: "/(app)/admin/users", scope: "accounts" },
  { icon: UserPlusIcon, label: "Créer un compte", href: "/(app)/admin/create-user", scope: "accounts" },
  { icon: UserPlusIcon, label: "Administrateurs", href: "/(app)/admin/administrators", scope: "full" },
  { icon: MedalIcon, label: "Modules de formation", href: "/(app)/admin/certification-modules", scope: "catalog" },
  { icon: BriefcaseIcon, label: "Offres d'emploi", href: "/(app)/admin/job-listings", scope: "catalog" },
  { icon: BriefcaseIcon, label: "Offres de stage", href: "/(app)/admin/internship-offers", scope: "catalog" },
];

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: adminApi.fetchDashboardStats,
  });

  const canModerate = adminHasScope(user?.admin_scope, "moderation");
  const gestionTiles = GESTION_TILES.filter((item) => adminHasScope(user?.admin_scope, item.scope));

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

        {canModerate && (
          <View className="gap-3">
            <SectionTitle title="À traiter" />

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
          </View>
        )}

        {gestionTiles.length > 0 && (
        <View className="gap-3">
          <SectionTitle title="Gestion de la plateforme" />
          <View className="flex-row flex-wrap gap-3">
            {gestionTiles.map((item) => (
              <Card
                key={item.label}
                onPress={() => router.push(item.href as never)}
                className="items-center gap-2 flex-1 min-w-[45%] py-5"
              >
                <View className="h-11 w-11 rounded-full bg-xporadia-bg items-center justify-center">
                  <item.icon size={20} color={Colors.navy} />
                </View>
                <Text className="text-xs font-semibold text-xporadia-text-primary text-center">{item.label}</Text>
              </Card>
            ))}
          </View>
        </View>
        )}
      </ScrollView>
    </View>
  );
}
