import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as internshipsApi from "@/services/internships";

export default function AdminInternshipOffersScreen() {
  const queryClient = useQueryClient();
  const { data: offers, isLoading } = useQuery({
    queryKey: ["admin-internship-offers"],
    queryFn: () => internshipsApi.fetchInternshipOffers(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      internshipsApi.updateInternshipOffer(id, { is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-internship-offers"] }),
    onError: () => Alert.alert("Erreur", "Impossible de modifier cette offre."),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Offres de stage</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Toutes les offres, toutes entreprises confondues, y compris les offres inactives.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !offers || offers.length === 0 ? (
        <View className="items-center gap-2 py-8">
          <BriefcaseIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucune offre pour l&apos;instant.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {offers.map((offer) => (
            <View key={offer.id} className="bg-white rounded-2xl p-4 shadow-soft gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
                  {offer.title}
                </Text>
                <Chip label={offer.is_active ? "Active" : "Inactive"} variant={offer.is_active ? "navy-subtle" : "neutral"} />
              </View>
              <Text className="text-xs text-xporadia-text-secondary">
                {offer.company.company_name} · {offer.city} · {offer.application_count} candidature(s)
              </Text>
              <Button
                label={offer.is_active ? "Désactiver cette offre" : "Réactiver cette offre"}
                variant="secondary"
                pill
                loading={toggleMutation.isPending}
                onPress={() =>
                  Alert.alert(offer.is_active ? "Désactiver cette offre ?" : "Réactiver cette offre ?", offer.title, [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Confirmer",
                      onPress: () => toggleMutation.mutate({ id: offer.id, isActive: !offer.is_active }),
                    },
                  ])
                }
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
