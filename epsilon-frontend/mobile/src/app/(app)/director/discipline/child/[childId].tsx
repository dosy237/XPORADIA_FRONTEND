import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { WarningIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as disciplineApi from "@/services/discipline";
import type { DisciplinaryIncident, IncidentSanction, IncidentSeverity } from "@/services/discipline";

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string }[] = [
  { value: "minor", label: "Mineur" },
  { value: "moderate", label: "Modéré" },
  { value: "serious", label: "Grave" },
];

const SANCTION_OPTIONS: { value: IncidentSanction; label: string }[] = [
  { value: "none", label: "Aucune" },
  { value: "warning", label: "Avertissement" },
  { value: "reprimand", label: "Blâme" },
  { value: "detention", label: "Retenue" },
  { value: "suspension", label: "Exclusion temporaire" },
];

const SEVERITY_BADGE: Record<IncidentSeverity, { bg: string; text: string }> = {
  minor: { bg: "bg-xporadia-border/60", text: "text-xporadia-text-secondary" },
  moderate: { bg: "bg-xporadia-gold/15", text: "text-xporadia-gold" },
  serious: { bg: "bg-xporadia-red/10", text: "text-xporadia-red" },
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function IncidentRow({ incident }: { incident: DisciplinaryIncident }) {
  const queryClient = useQueryClient();
  const badge = SEVERITY_BADGE[incident.severity];
  const notifyMutation = useMutation({
    mutationFn: () => disciplineApi.notifyParentAboutIncident(incident.id),
    onSuccess: (updated) => {
      queryClient.setQueryData<DisciplinaryIncident[] | undefined>(
        ["child-incidents", incident.child],
        (prev) => prev?.map((i) => (i.id === updated.id ? updated : i))
      );
    },
    onError: () => Alert.alert("Erreur", "Impossible d'envoyer la notification (aucun compte parent actif ?)."),
  });

  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-xs text-xporadia-text-secondary">
          {new Date(incident.occurred_on).toLocaleDateString("fr-FR")}
        </Text>
        <View className={`rounded-full px-2.5 py-1 ${badge.bg}`}>
          <Text className={`text-[10px] font-bold uppercase ${badge.text}`}>{incident.severity_label}</Text>
        </View>
      </View>
      <Text className="text-sm text-xporadia-text-primary leading-5">{incident.description}</Text>
      <Text className="text-xs text-xporadia-text-secondary">
        Sanction : {incident.sanction_label} · Consigné par {incident.recorded_by_name}
      </Text>
      {incident.parent_notified_at ? (
        <Text className="text-xs text-xporadia-green">
          Parent notifié le {new Date(incident.parent_notified_at).toLocaleDateString("fr-FR")}
        </Text>
      ) : (
        <Button
          label="Notifier le parent"
          variant="secondary"
          pill
          loading={notifyMutation.isPending}
          onPress={() => notifyMutation.mutate()}
        />
      )}
    </Card>
  );
}

export default function ChildDisciplineScreen() {
  const { childId, childName } = useLocalSearchParams<{ childId: string; childName?: string }>();
  const queryClient = useQueryClient();

  const [occurredOn, setOccurredOn] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("minor");
  const [sanction, setSanction] = useState<IncidentSanction>("none");

  const incidentsQueryKey = ["child-incidents", Number(childId)];
  const { data: incidents, isLoading } = useQuery({
    queryKey: incidentsQueryKey,
    queryFn: () => disciplineApi.fetchChildIncidents(Number(childId)),
    enabled: !!childId,
  });

  const recordMutation = useMutation({
    mutationFn: () =>
      disciplineApi.recordIncident(Number(childId), { occurred_on: occurredOn, description, severity, sanction }),
    onSuccess: (incident) => {
      queryClient.setQueryData<DisciplinaryIncident[] | undefined>(incidentsQueryKey, (prev) =>
        prev ? [incident, ...prev] : [incident]
      );
      setDescription("");
      setSeverity("minor");
      setSanction("none");
      setOccurredOn(todayIso());
    },
    onError: () => Alert.alert("Erreur", "Vérifiez les champs (date au format AAAA-MM-JJ, description obligatoire)."),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Suivi disciplinaire de {childName ?? "cet élève"}.
      </Text>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <WarningIcon size={16} color={Colors.orange} />
          <Text className="text-sm font-semibold text-xporadia-text-primary">Consigner un incident</Text>
        </View>
        <Input label="Date des faits" value={occurredOn} onChangeText={setOccurredOn} placeholder="2026-09-04" />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez les faits..."
          multiline
          numberOfLines={3}
        />
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-xporadia-text-secondary">Gravité</Text>
          <View className="flex-row flex-wrap gap-2">
            {SEVERITY_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                variant={severity === option.value ? "navy" : "neutral"}
                onPress={() => setSeverity(option.value)}
              />
            ))}
          </View>
        </View>
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-xporadia-text-secondary">Sanction</Text>
          <View className="flex-row flex-wrap gap-2">
            {SANCTION_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                variant={sanction === option.value ? "navy" : "neutral"}
                onPress={() => setSanction(option.value)}
              />
            ))}
          </View>
        </View>
        <Button
          label="Consigner l'incident"
          pill
          disabled={!occurredOn || !description.trim()}
          loading={recordMutation.isPending}
          onPress={() => recordMutation.mutate()}
        />
      </Card>

      <View className="gap-3">
        <Text className="text-sm font-semibold text-xporadia-text-primary">Historique</Text>
        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">Chargement...</Text>
        ) : !incidents || incidents.length === 0 ? (
          <Card>
            <Text className="text-sm text-xporadia-text-secondary text-center py-4">
              Aucun incident consigné pour l&apos;instant.
            </Text>
          </Card>
        ) : (
          incidents.map((incident) => <IncidentRow key={incident.id} incident={incident} />)
        )}
      </View>
    </ScrollView>
  );
}
