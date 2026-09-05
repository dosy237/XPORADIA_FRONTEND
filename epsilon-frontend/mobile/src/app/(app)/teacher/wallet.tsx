import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { DownloadIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function WalletScreen() {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ["my-wallet"],
    queryFn: employmentApi.fetchMyWallet,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="items-center py-8 gap-2 bg-xporadia-navy rounded-2xl shadow-deep">
        <Text className="text-xs text-white/60 uppercase tracking-wide">Solde</Text>
        <Text className="text-4xl font-bold text-white">
          {isLoading ? "..." : (wallet?.balance ?? 0).toLocaleString("fr-FR")}
        </Text>
        <Text className="text-xs text-white/60">FCFA</Text>
      </View>

      <View className="gap-3">
        <Text className="text-base font-bold text-xporadia-navy">Historique des paies</Text>
        {isLoading ? (
          <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : wallet && wallet.transactions.length > 0 ? (
          wallet.transactions.map((t) => (
            <Card key={t.id} className="flex-row items-center gap-3">
              <View className="h-10 w-10 rounded-full bg-xporadia-orange/10 items-center justify-center">
                <DownloadIcon size={16} color={Colors.orange} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  {`${MONTH_LABELS[t.payroll_entry.period_month - 1]} ${t.payroll_entry.period_year}`}
                </Text>
                <Text className="text-xs text-xporadia-text-secondary">
                  {`${t.payroll_entry.school_name} · ${t.payroll_entry.total_hours}h à ${t.payroll_entry.hourly_rate_teacher.toLocaleString("fr-FR")} FCFA/h`}
                </Text>
              </View>
              <Text className="text-sm font-bold text-xporadia-navy">
                +{t.amount.toLocaleString("fr-FR")}
              </Text>
            </Card>
          ))
        ) : (
          <Text className="text-xs text-xporadia-text-secondary text-center py-10">
            Aucune paie perçue pour l'instant — vos heures validées seront comptabilisées à la
            prochaine clôture mensuelle.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
