import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as employmentApi from "@/services/employment";
import type { JobListing } from "@/services/employment";

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  vacation: "Vacation",
  interim: "Intérim",
};

function ListingCard({ listing }: { listing: JobListing }) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(app)/teacher/job-offers/[listingId]",
          params: { listingId: listing.id },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`Voir l'offre ${listing.title}`}
      className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2"
    >
      <Text className="text-base font-semibold text-xporadia-text-primary">{listing.title}</Text>
      <Text className="text-xs text-xporadia-text-secondary">
        {listing.school.school_name} · {listing.city}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        <Chip label={listing.subject} variant="navy-subtle" />
        <Chip label={CONTRACT_LABELS[listing.contract_type] ?? listing.contract_type} variant="neutral" />
      </View>
    </Pressable>
  );
}

export default function TeacherJobOffersScreen() {
  const [subject, setSubject] = useState("");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["job-offers", subject],
    queryFn: () => employmentApi.fetchJobListings(subject ? { subject } : undefined),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Offres d&apos;emploi publiées par les établissements partenaires.
      </Text>
      <Input
        placeholder="Rechercher par matière (ex. Maths)"
        value={subject}
        onChangeText={setSubject}
        accessibilityLabel="Rechercher une offre par matière"
      />

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (listings ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune offre pour l&apos;instant.
        </Text>
      ) : (
        <View className="gap-3">
          {(listings ?? []).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
