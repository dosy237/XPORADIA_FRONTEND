import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CoinIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as tuitionApi from "@/services/tuition";

/** Année scolaire par défaut — convention août à juillet, cohérente avec
 * la façon dont le reste du projet nomme ses années scolaires
 * ("2025-2026"). */
function defaultSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function LateFamilyRow({ family }: { family: tuitionApi.LateFamily }) {
  const queryClient = useQueryClient();
  const remindMutation = useMutation({
    mutationFn: () => tuitionApi.remindLateFamily(family.child_id),
    onSuccess: () => Alert.alert("Relance envoyée", `La famille de ${family.child_name} a été notifiée.`),
    onError: () => Alert.alert("Erreur", "Impossible d'envoyer la relance (aucun compte parent actif ?)."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] }),
  });

  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-xporadia-border py-3">
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-xporadia-text-primary">{family.child_name}</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {family.late_installments.map((name) => (
            <Chip key={name} label={name} variant="orange" />
          ))}
        </View>
      </View>
      <Button
        label="Relancer"
        variant="secondary"
        pill
        loading={remindMutation.isPending}
        onPress={() => remindMutation.mutate()}
      />
    </View>
  );
}

export default function TuitionDashboardScreen() {
  const [schoolYear] = useState(defaultSchoolYear());

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["fee-dashboard", schoolYear],
    queryFn: () => tuitionApi.fetchFeeDashboard(schoolYear),
  });

  const collectedRatio = dashboard && dashboard.total_expected > 0
    ? Math.round((dashboard.total_collected / dashboard.total_expected) * 100)
    : null;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary">Année scolaire {schoolYear}</Text>

      <Card
        onPress={() => router.push({ pathname: "/(app)/director/tuition/schedule", params: { schoolYear } })}
        className="flex-row items-center gap-3"
      >
        <View className="h-10 w-10 rounded-full bg-xporadia-orange/10 items-center justify-center">
          <CoinIcon size={18} color={Colors.orange} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">Configurer l&apos;échéancier</Text>
          <Text className="text-xs text-xporadia-text-secondary">
            Tranches de frais de scolarité pour {schoolYear}.
          </Text>
        </View>
      </Card>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : !dashboard || dashboard.total_expected === 0 ? (
        <Card>
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">
            Aucun échéancier configuré pour {schoolYear} pour l&apos;instant.
          </Text>
        </Card>
      ) : (
        <>
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center gap-1">
              <Text className="text-xl font-extrabold text-xporadia-navy">
                {dashboard.total_expected.toLocaleString("fr-FR")}
              </Text>
              <Text className="text-[11px] text-xporadia-text-secondary text-center">
                FCFA attendus cette année
              </Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-xl font-extrabold text-xporadia-green">
                {dashboard.total_collected.toLocaleString("fr-FR")}
              </Text>
              <Text className="text-[11px] text-xporadia-text-secondary text-center">
                FCFA encaissés{collectedRatio !== null ? ` (${collectedRatio}%)` : ""}
              </Text>
            </Card>
          </View>

          <Card className="gap-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">
              Familles en retard{" "}
              {dashboard.late_families.length > 0 ? `(${dashboard.late_families.length})` : ""}
            </Text>
            {dashboard.late_families.length === 0 ? (
              <Text className="text-xs text-xporadia-text-secondary py-2">
                Aucune famille en retard pour l&apos;instant.
              </Text>
            ) : (
              <View className="mt-1">
                {dashboard.late_families.map((family) => (
                  <LateFamilyRow key={family.child_id} family={family} />
                ))}
              </View>
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
