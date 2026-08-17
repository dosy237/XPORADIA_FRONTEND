import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";
import type { JobStatus } from "@/services/employment";

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Brouillon",
  active: "Active",
  closed: "Clôturée",
  expired: "Expirée",
};

export default function AdminJobListingsScreen() {
  const queryClient = useQueryClient();
  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-job-listings"],
    queryFn: () => employmentApi.fetchJobListings(),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => employmentApi.closeJobListing(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-job-listings"] }),
    onError: () => Alert.alert("Erreur", "Impossible de clôturer cette offre."),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Offres d&apos;emploi</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Toutes les offres, tous établissements confondus, y compris les brouillons.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !listings || listings.length === 0 ? (
        <View className="items-center gap-2 py-8">
          <BriefcaseIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucune offre pour l&apos;instant.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {listings.map((listing) => (
            <View key={listing.id} className="bg-white rounded-2xl p-4 shadow-soft gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
                  {listing.title}
                </Text>
                <Chip label={STATUS_LABELS[listing.status]} variant={listing.status === "active" ? "navy-subtle" : "neutral"} />
              </View>
              <Text className="text-xs text-xporadia-text-secondary">
                {listing.school.school_name} · {listing.city} · {listing.application_count} candidature(s)
              </Text>
              {listing.status !== "closed" && (
                <Button
                  label="Clôturer cette offre"
                  variant="secondary"
                  pill
                  loading={closeMutation.isPending}
                  onPress={() =>
                    Alert.alert("Clôturer cette offre ?", listing.title, [
                      { text: "Annuler", style: "cancel" },
                      { text: "Clôturer", style: "destructive", onPress: () => closeMutation.mutate(listing.id) },
                    ])
                  }
                />
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
