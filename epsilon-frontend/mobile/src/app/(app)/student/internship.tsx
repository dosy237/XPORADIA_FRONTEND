import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, StarIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as internshipsApi from "@/services/internships";
import type { ConventionStatus, InternshipConvention } from "@/services/internships";

const STATUS_LABEL: Record<ConventionStatus, string> = {
  generated: "En attente de signature",
  signed_sch: "Signée par l'établissement",
  signed_ent: "Signée par l'entreprise",
  complete: "Stage confirmé",
};

interface ReviewFormState {
  atmosphere: number;
  mentorship: number;
  role_accuracy: number;
  learning_value: number;
}

const CRITERIA: { key: keyof ReviewFormState; label: string }[] = [
  { key: "atmosphere", label: "Ambiance, accueil" },
  { key: "mentorship", label: "Qualité de l'encadrement" },
  { key: "role_accuracy", label: "Conformité au poste annoncé" },
  { key: "learning_value", label: "Apport pédagogique" },
];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <StarIcon size={18} color={Colors.orange} filled={n <= value} />
        </Pressable>
      ))}
    </View>
  );
}

function CompanyReviewForm({ convention, onDone }: { convention: InternshipConvention; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ReviewFormState>({
    atmosphere: 0, mentorship: 0, role_accuracy: 0, learning_value: 0,
  });
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => internshipsApi.submitCompanyReview(convention.id, { ...form, comment: comment.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-conventions"] });
      onDone();
    },
  });

  const allRated = Object.values(form).every((v) => v > 0);

  return (
    <Card className="gap-3">
      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
        Votre avis sur cette entreprise
      </Text>
      {CRITERIA.map((c) => (
        <View key={c.key} className="flex-row items-center justify-between">
          <Text className="text-sm text-xporadia-text-primary flex-1 pr-2">{c.label}</Text>
          <StarPicker value={form[c.key]} onChange={(v) => setForm((f) => ({ ...f, [c.key]: v }))} />
        </View>
      ))}
      <Input
        label="Commentaire (optionnel)"
        value={comment}
        onChangeText={setComment}
        placeholder="Votre expérience en quelques mots..."
        multiline
        numberOfLines={3}
        style={{ height: 80, textAlignVertical: "top" }}
      />
      <Button label="Envoyer mon avis" pill onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!allRated} />
    </Card>
  );
}

function ConventionCard({ convention }: { convention: InternshipConvention }) {
  const [reviewing, setReviewing] = useState(false);

  return (
    <View className="gap-2">
      <Card className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-xporadia-navy flex-1">
            {convention.position_title}
          </Text>
          <Chip
            label={STATUS_LABEL[convention.status]}
            variant={convention.status === "complete" ? "orange" : "navy-subtle"}
          />
        </View>
        <Text className="text-sm text-xporadia-text-secondary">
          {convention.application.offer.company.company_name}
        </Text>
        <View className="flex-row justify-between mt-1">
          <Text className="text-xs text-xporadia-text-secondary">Ville</Text>
          <Text className="text-xs font-semibold text-xporadia-text-primary">
            {convention.application.offer.city}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-xporadia-text-secondary">Domaine</Text>
          <Text className="text-xs font-semibold text-xporadia-text-primary">
            {convention.application.offer.domain}
          </Text>
        </View>

        {convention.channel_id ? (
          <Button
            label="Ouvrir le canal de stage"
            pill
            variant="secondary"
            onPress={() => router.push(`/(app)/messages/${convention.channel_id}`)}
          />
        ) : null}
      </Card>

      {convention.has_company_review ? (
        <Text className="text-xs text-xporadia-text-secondary px-1">Vous avez déjà laissé un avis, merci.</Text>
      ) : convention.can_review_company ? (
        reviewing ? (
          <CompanyReviewForm convention={convention} onDone={() => setReviewing(false)} />
        ) : (
          <Text
            className="text-xs font-semibold text-xporadia-orange-text px-1"
            onPress={() => setReviewing(true)}
            suppressHighlighting
          >
            Laisser un avis sur cette entreprise
          </Text>
        )
      ) : null}
    </View>
  );
}

export default function InternshipScreen() {
  const { data: conventions, isLoading } = useQuery({
    queryKey: ["my-conventions"],
    queryFn: internshipsApi.fetchMyConventions,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!conventions || conventions.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-8 gap-3">
        <BriefcaseIcon size={28} color={Colors.textSecondary} />
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Vous n&apos;avez aucun stage pour le moment.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      {conventions.map((convention) => (
        <ConventionCard key={convention.id} convention={convention} />
      ))}
    </ScrollView>
  );
}
