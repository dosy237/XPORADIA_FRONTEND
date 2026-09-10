import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import * as disciplineApi from "@/services/discipline";
import type { DisciplinaryIncident } from "@/services/discipline";

/** Année scolaire par défaut — même convention août à juillet que
 * director/tuition/index.tsx. */
function defaultSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function RecentIncidentRow({ incident, schoolYear }: { incident: DisciplinaryIncident; schoolYear: string }) {
  const queryClient = useQueryClient();
  const notifyMutation = useMutation({
    mutationFn: () => disciplineApi.notifyParentAboutIncident(incident.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents-dashboard", schoolYear] }),
    onError: () => Alert.alert("Erreur", "Impossible d'envoyer la notification (aucun compte parent actif ?)."),
  });

  return (
    <View className="gap-1.5 border-b border-xporadia-border py-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-semibold text-xporadia-text-primary">{incident.child_name}</Text>
        <Text className="text-xs text-xporadia-text-secondary">
          {new Date(incident.occurred_on).toLocaleDateString("fr-FR")}
        </Text>
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {incident.class_name} · {incident.severity_label} · {incident.sanction_label}
      </Text>
      {incident.parent_notified_at ? (
        <Text className="text-xs text-xporadia-green">Parent notifié</Text>
      ) : (
        <Button
          label="Notifier le parent"
          variant="secondary"
          pill
          loading={notifyMutation.isPending}
          onPress={() => notifyMutation.mutate()}
        />
      )}
    </View>
  );
}

export default function DisciplineDashboardScreen() {
  const [schoolYear] = useState(defaultSchoolYear());

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["incidents-dashboard", schoolYear],
    queryFn: () => disciplineApi.fetchIncidentsDashboard(schoolYear),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary">Année scolaire {schoolYear}</Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : !dashboard || dashboard.total === 0 ? (
        <Card>
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">
            Aucun incident consigné pour {schoolYear} pour l&apos;instant.
          </Text>
        </Card>
      ) : (
        <>
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center gap-1">
              <Text className="text-xl font-extrabold text-xporadia-navy">
                {dashboard.by_severity.minor}
              </Text>
              <Text className="text-[11px] text-xporadia-text-secondary text-center">Mineurs</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-xl font-extrabold text-xporadia-gold">
                {dashboard.by_severity.moderate}
              </Text>
              <Text className="text-[11px] text-xporadia-text-secondary text-center">Modérés</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-xl font-extrabold text-xporadia-red">
                {dashboard.by_severity.serious}
              </Text>
              <Text className="text-[11px] text-xporadia-text-secondary text-center">Graves</Text>
            </Card>
          </View>

          <Card className="gap-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">
              Incidents récents ({dashboard.total})
            </Text>
            <View className="mt-1">
              {dashboard.recent.map((incident) => (
                <RecentIncidentRow key={incident.id} incident={incident} schoolYear={schoolYear} />
              ))}
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
