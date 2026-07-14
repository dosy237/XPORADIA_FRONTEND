import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as employmentApi from "@/services/employment";

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  vacation: "Vacation",
  interim: "Intérim",
};

export default function JobListingDetailScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const [coverLetter, setCoverLetter] = useState("");
  const [applied, setApplied] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["job-listing", listingId],
    queryFn: () => employmentApi.fetchJobListing(String(listingId)),
    enabled: !!listingId,
  });

  const applyMutation = useMutation({
    mutationFn: () => employmentApi.applyToListing(String(listingId), coverLetter),
    onSuccess: () => setApplied(true),
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? "Impossible d'envoyer votre candidature.";
      Alert.alert("Erreur", Array.isArray(detail) ? detail.join(" ") : String(detail));
    },
  });

  if (isLoading || !listing) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
        <Text className="text-lg font-bold text-xporadia-navy">{listing.title}</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          {listing.school.school_name} · {listing.city}
        </Text>
        <View className="flex-row flex-wrap gap-1.5 mt-1">
          <Chip label={listing.subject} variant="navy-subtle" />
          <Chip label={CONTRACT_LABELS[listing.contract_type] ?? listing.contract_type} variant="neutral" />
        </View>
        {(listing.salary_min || listing.salary_max) && (
          <Text className="text-xs text-xporadia-text-secondary">
            Salaire : {listing.salary_min ?? "?"} — {listing.salary_max ?? "?"} FCFA
          </Text>
        )}
        <Text className="text-sm text-xporadia-text-primary leading-5 mt-2">{listing.description}</Text>
      </View>

      <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
          Postuler
        </Text>
        {applied ? (
          <Text className="text-sm text-xporadia-green">Candidature envoyée !</Text>
        ) : (
          <>
            <Input
              placeholder="Lettre de motivation (optionnel)"
              value={coverLetter}
              onChangeText={setCoverLetter}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: "top" }}
            />
            <Button
              label="Envoyer ma candidature"
              pill
              loading={applyMutation.isPending}
              onPress={() => applyMutation.mutate()}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}
