import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, CloseIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as establishmentApi from "@/services/establishmentDirectory";
import * as internshipsApi from "@/services/internships";

function DistributeModal({
  offer,
  onClose,
}: {
  offer: internshipsApi.InternshipOffer;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);

  const { data: establishments, isLoading } = useQuery({
    queryKey: ["establishment-directory-for-distribute"],
    queryFn: () => establishmentApi.fetchEstablishmentDirectory(),
  });

  const distributeMutation = useMutation({
    mutationFn: () => internshipsApi.distributeInternshipOfferToSchools(offer.id, selected),
    onSuccess: () => {
      Alert.alert("Offre transmise", "Les établissements sélectionnés ont été notifiés.");
      onClose();
    },
    onError: () => Alert.alert("Erreur", "Impossible de transmettre cette offre."),
  });

  const toggle = (id: number) => {
    setSelected((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-xporadia-bg">
        <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-xporadia-border">
          <Text className="text-sm font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
            Envoyer « {offer.title} » à des établissements
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={8}>
            <CloseIcon size={18} color={Colors.navy} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="p-6 gap-2 pb-8">
          {isLoading ? (
            <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
          ) : !establishments || establishments.length === 0 ? (
            <Text className="text-sm text-xporadia-text-secondary text-center py-8">
              Aucun établissement disponible.
            </Text>
          ) : (
            establishments.map((school) => {
              const isSelected = selected.includes(school.id);
              return (
                <Pressable
                  key={school.id}
                  onPress={() => toggle(school.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={school.school_name}
                  className={`flex-row items-center justify-between rounded-xl px-4 py-3 border ${
                    isSelected ? "bg-xporadia-navy/[0.06] border-xporadia-navy" : "bg-white border-xporadia-border"
                  }`}
                >
                  <Text className="text-sm text-xporadia-text-primary flex-1" numberOfLines={1}>
                    {school.school_name}
                  </Text>
                  {isSelected && <Chip label="Sélectionné" variant="navy" />}
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <View className="p-6 pt-0">
          <Button
            label={`Envoyer${selected.length > 0 ? ` (${selected.length})` : ""}`}
            pill
            disabled={selected.length === 0 || distributeMutation.isPending}
            loading={distributeMutation.isPending}
            onPress={() => distributeMutation.mutate()}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function AdminInternshipOffersScreen() {
  const queryClient = useQueryClient();
  const [distributingOffer, setDistributingOffer] = useState<internshipsApi.InternshipOffer | null>(null);

  const { data: offers, isLoading } = useQuery({
    queryKey: ["admin-internship-offers"],
    queryFn: () => internshipsApi.fetchInternshipOffers(),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      internshipsApi.updateInternshipOffer(id, { is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-internship-offers"] }),
    onError: () => Alert.alert("Erreur", "Impossible de modifier cette offre."),
  });

  const togglePremiumMutation = useMutation({
    mutationFn: ({ id, isPremium }: { id: string; isPremium: boolean }) =>
      internshipsApi.updateInternshipOffer(id, { is_premium: isPremium }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-internship-offers"] }),
    onError: () => Alert.alert("Erreur", "Impossible de mettre en avant cette offre."),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Offres de stage</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Toutes les offres, toutes entreprises confondues, y compris les offres inactives. Mettez en avant les
          meilleures offres et transmettez-les aux établissements intéressés.
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
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">
                  {offer.title}
                </Text>
                <View className="flex-row gap-1.5">
                  {offer.is_premium && <Chip label="Mise en avant" variant="orange" />}
                  <Chip label={offer.is_active ? "Active" : "Inactive"} variant={offer.is_active ? "navy-subtle" : "neutral"} />
                </View>
              </View>
              <Text className="text-xs text-xporadia-text-secondary">
                {offer.company.company_name} · {offer.city} · {offer.application_count} candidature(s)
              </Text>

              <View className="flex-row flex-wrap gap-2 mt-1">
                <Button
                  label={offer.is_active ? "Désactiver" : "Réactiver"}
                  variant="secondary"
                  pill
                  loading={toggleActiveMutation.isPending}
                  onPress={() =>
                    Alert.alert(offer.is_active ? "Désactiver cette offre ?" : "Réactiver cette offre ?", offer.title, [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Confirmer",
                        onPress: () => toggleActiveMutation.mutate({ id: offer.id, isActive: !offer.is_active }),
                      },
                    ])
                  }
                />
                <Button
                  label={offer.is_premium ? "Retirer la mise en avant" : "Mettre en avant"}
                  variant="secondary"
                  pill
                  loading={togglePremiumMutation.isPending}
                  onPress={() => togglePremiumMutation.mutate({ id: offer.id, isPremium: !offer.is_premium })}
                />
                <Button
                  label="Envoyer aux établissements"
                  variant="secondary"
                  pill
                  onPress={() => setDistributingOffer(offer)}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {distributingOffer ? (
        <DistributeModal offer={distributingOffer} onClose={() => setDistributingOffer(null)} />
      ) : null}
    </ScrollView>
  );
}
