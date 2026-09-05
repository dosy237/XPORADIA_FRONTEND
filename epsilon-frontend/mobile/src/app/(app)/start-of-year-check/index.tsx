import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, WarningIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";

function MismatchCard({ mismatch }: { mismatch: academicsApi.LevelMismatch }) {
  const queryClient = useQueryClient();
  const [correcting, setCorrecting] = useState(false);

  const { data: classes } = useQuery({
    queryKey: ["all-my-classes"],
    queryFn: academicsApi.fetchAllMyClasses,
    enabled: correcting,
  });

  const mutation = useMutation({
    mutationFn: (schoolClassId: number) =>
      academicsApi.correctEnrollmentClass(mismatch.enrollment, schoolClassId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["start-of-year-check"] });
      setCorrecting(false);
    },
    onError: () => Alert.alert("Erreur", "Impossible de corriger cette affectation."),
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <Text className="text-sm font-semibold text-xporadia-text-primary">
        {mismatch.first_name} {mismatch.last_name}
      </Text>
      <View className="flex-row items-center gap-2">
        <Chip label={`Déclaré : ${mismatch.declared_level}`} variant="orange" />
        <Chip label={`Actuellement : ${mismatch.current_class}`} variant="neutral" />
      </View>

      {correcting ? (
        <View className="gap-2 mt-1">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
            Corriger vers
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(classes ?? [])
              .filter((c) => c.id !== mismatch.current_class_id)
              .map((c) => (
                <Pressable key={c.id} onPress={() => mutation.mutate(c.id)} disabled={mutation.isPending}>
                  <Chip label={c.name} variant="navy-subtle" />
                </Pressable>
              ))}
          </View>
          <Text className="text-xs text-xporadia-text-secondary" onPress={() => setCorrecting(false)} suppressHighlighting>
            Annuler
          </Text>
        </View>
      ) : (
        <Text
          className="text-xs font-semibold text-xporadia-orange-text mt-1"
          onPress={() => setCorrecting(true)}
          suppressHighlighting
        >
          Corriger l&apos;affectation
        </Text>
      )}
    </View>
  );
}

export default function StartOfYearCheckScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["start-of-year-check"],
    queryFn: academicsApi.fetchStartOfYearCheck,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Vérification de rentrée</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Compare le niveau déclaré par chaque élève à sa classe réelle — une comparaison
          indicative, à vous de trancher pour chaque cas.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Vérification en cours...</Text>
      ) : data && data.mismatches_found > 0 ? (
        <>
          <View className="bg-xporadia-orange/10 rounded-2xl p-4 flex-row items-center gap-3">
            <WarningIcon size={20} color={Colors.orange} />
            <Text className="text-xs text-xporadia-text-primary flex-1">
              {data.mismatches_found} écart(s) trouvé(s) sur {data.total_checked} élève(s) vérifié(s).
            </Text>
          </View>
          <View className="gap-3">
            {data.mismatches.map((m) => (
              <MismatchCard key={m.enrollment} mismatch={m} />
            ))}
          </View>
        </>
      ) : (
        <View className="items-center gap-2 py-10">
          <CheckCircleIcon size={24} color={Colors.navy} />
          <Text className="text-sm text-xporadia-text-primary font-semibold">Tout est cohérent</Text>
          <Text className="text-xs text-xporadia-text-secondary">
            {data?.total_checked ?? 0} élève(s) vérifié(s), aucun écart.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
