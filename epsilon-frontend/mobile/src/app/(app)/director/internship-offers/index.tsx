import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as internshipsApi from "@/services/internships";
import type { InternshipOffer } from "@/services/internships";

function OfferCard({ offer }: { offer: InternshipOffer }) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(app)/director/internship-offers/[offerId]",
          params: { offerId: offer.id },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`Voir l'offre de stage ${offer.title}`}
      className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2"
    >
      <Text className="text-base font-semibold text-xporadia-text-primary">{offer.title}</Text>
      <Text className="text-xs text-xporadia-text-secondary">
        {offer.company.company_name} · {offer.city}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        <Chip label={offer.domain} variant="navy-subtle" />
        <Chip label={`${offer.duration_weeks} sem.`} variant="neutral" />
      </View>
    </Pressable>
  );
}

export default function DirectorInternshipOffersScreen() {
  const [domain, setDomain] = useState("");

  const { data: offers, isLoading } = useQuery({
    queryKey: ["internship-offers", domain],
    queryFn: () => internshipsApi.fetchInternshipOffers(domain ? { domain } : undefined),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Offres de stage publiées par les entreprises partenaires.
      </Text>
      <Input
        placeholder="Rechercher par domaine (ex. Informatique)"
        value={domain}
        onChangeText={setDomain}
        accessibilityLabel="Rechercher une offre par domaine"
      />

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (offers ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune offre pour l&apos;instant.
        </Text>
      ) : (
        <View className="gap-3">
          {(offers ?? []).map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
