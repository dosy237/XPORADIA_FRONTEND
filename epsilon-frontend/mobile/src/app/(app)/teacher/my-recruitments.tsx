import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, StarIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";
import type { ContractType, Recruitment } from "@/services/employment";

const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  vacation: "Vacation",
  interim: "Intérim",
};

const CRITERIA: { key: keyof ReviewFormState; label: string }[] = [
  { key: "atmosphere", label: "Ambiance" },
  { key: "contract_respect", label: "Respect du contrat" },
  { key: "working_conditions", label: "Conditions de travail" },
  { key: "payment_timeliness", label: "Ponctualité des paiements" },
];

interface ReviewFormState {
  atmosphere: number;
  contract_respect: number;
  working_conditions: number;
  payment_timeliness: number;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <StarIcon size={20} color={Colors.orange} filled={n <= value} />
        </Pressable>
      ))}
    </View>
  );
}

function ReviewForm({ recruitment, onDone }: { recruitment: Recruitment; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ReviewFormState>({
    atmosphere: 0,
    contract_respect: 0,
    working_conditions: 0,
    payment_timeliness: 0,
  });

  const mutation = useMutation({
    mutationFn: () => employmentApi.submitEmployerReview(recruitment.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-recruitments"] });
      onDone();
    },
  });

  const allRated = Object.values(form).every((v) => v > 0);

  return (
    <Card className="gap-3">
      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
        Votre avis reste anonyme
      </Text>
      {CRITERIA.map((c) => (
        <View key={c.key} className="flex-row items-center justify-between">
          <Text className="text-sm text-xporadia-text-primary">{c.label}</Text>
          <StarPicker value={form[c.key]} onChange={(v) => setForm((f) => ({ ...f, [c.key]: v }))} />
        </View>
      ))}
      <Button label="Envoyer mon avis" pill onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!allRated} />
    </Card>
  );
}

export default function MyRecruitmentsScreen() {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const { data: recruitments, isLoading } = useQuery({
    queryKey: ["my-recruitments"],
    queryFn: employmentApi.fetchMyRecruitments,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Mes postes</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Un CDI se paie en salaire fixe ; les autres contrats se paient sur vos heures déclarées et
          validées.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : recruitments && recruitments.length > 0 ? (
        <View className="gap-3">
          {recruitments.map((r) => (
            <View key={r.id} className="gap-2">
              <Card
                onPress={() =>
                  r.requires_declared_hours ? router.push(`/(app)/teacher/recruitment/${r.id}`) : undefined
                }
                className="gap-2"
              >
                <View className="flex-row items-center justify-between">
                  <Chip label={CONTRACT_LABELS[r.contract_type]} variant="navy-subtle" />
                  <Text className="text-xs text-xporadia-text-secondary">
                    Depuis le {new Date(r.confirmed_at).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
                {r.requires_declared_hours ? (
                  <Text className="text-sm text-xporadia-text-primary">
                    {r.hourly_rate_teacher?.toLocaleString("fr-FR")} FCFA/heure — touchez l'écran pour
                    déclarer vos heures
                  </Text>
                ) : (
                  <Text className="text-sm text-xporadia-text-primary">
                    Salaire fixe : {r.salary_agreed?.toLocaleString("fr-FR")} FCFA/mois
                  </Text>
                )}
              </Card>

              {r.has_review ? (
                <Text className="text-xs text-xporadia-text-secondary px-1">Avis déjà envoyé, merci.</Text>
              ) : r.can_review ? (
                reviewingId === r.id ? (
                  <ReviewForm recruitment={r} onDone={() => setReviewingId(null)} />
                ) : (
                  <Text
                    className="text-xs font-semibold text-xporadia-orange-text px-1"
                    onPress={() => setReviewingId(r.id)}
                    suppressHighlighting
                  >
                    Laisser un avis sur cet établissement
                  </Text>
                )
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-10">
          <BriefcaseIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucun poste confirmé pour l'instant.</Text>
        </View>
      )}
    </ScrollView>
  );
}
