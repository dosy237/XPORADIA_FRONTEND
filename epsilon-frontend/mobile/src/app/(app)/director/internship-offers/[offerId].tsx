import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as academicsApi from "@/services/academics";
import type { ChildBasic } from "@/services/academics";
import * as internshipsApi from "@/services/internships";

export default function InternshipOfferDetailScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const [parentEmail, setParentEmail] = useState("");
  const [foundChildren, setFoundChildren] = useState<ChildBasic[] | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildBasic | null>(null);
  const [motivation, setMotivation] = useState("");
  const [applied, setApplied] = useState(false);

  const { data: offer, isLoading } = useQuery({
    queryKey: ["internship-offer", offerId],
    queryFn: () => internshipsApi.fetchInternshipOffer(String(offerId)),
    enabled: !!offerId,
  });

  const lookupMutation = useMutation({
    mutationFn: () => academicsApi.lookupChildrenByParentEmail(parentEmail),
    onSuccess: (children) => {
      setFoundChildren(children);
      setSelectedChild(null);
    },
    onError: () => Alert.alert("Erreur", "Impossible de rechercher cet email."),
  });

  const applyMutation = useMutation({
    mutationFn: () => internshipsApi.applyForInternship(String(offerId), selectedChild!.id, motivation),
    onSuccess: () => setApplied(true),
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? "Impossible d'envoyer cette candidature.";
      Alert.alert("Erreur", Array.isArray(detail) ? detail.join(" ") : String(detail));
    },
  });

  if (isLoading || !offer) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
        <Text className="text-lg font-bold text-xporadia-navy">{offer.title}</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          {offer.company.company_name} · {offer.city}
        </Text>
        <View className="flex-row flex-wrap gap-1.5 mt-1">
          <Chip label={offer.domain} variant="navy-subtle" />
          <Chip label={`${offer.duration_weeks} semaines`} variant="neutral" />
        </View>
        <Text className="text-sm text-xporadia-text-primary leading-5 mt-2">{offer.missions}</Text>
      </View>

      <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
          Candidater au nom d&apos;un élève
        </Text>
        {applied ? (
          <Text className="text-sm text-xporadia-green">Candidature envoyée !</Text>
        ) : (
          <>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  placeholder="Email du parent"
                  value={parentEmail}
                  onChangeText={setParentEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <Button
                label="Rechercher"
                pill
                disabled={!parentEmail || lookupMutation.isPending}
                onPress={() => lookupMutation.mutate()}
              />
            </View>

            {foundChildren && (
              <View className="gap-2">
                {foundChildren.length === 0 ? (
                  <Text className="text-xs text-xporadia-text-secondary">
                    Aucun enfant trouvé pour cet email.
                  </Text>
                ) : (
                  foundChildren.map((child) => (
                    <Pressable
                      key={child.id}
                      onPress={() => setSelectedChild(child)}
                      className="flex-row items-center justify-between rounded-xl px-3 py-2"
                      style={{
                        backgroundColor: selectedChild?.id === child.id ? "#FB540622" : "#F8F8F8",
                      }}
                    >
                      <Text className="text-sm text-xporadia-text-primary">
                        {child.first_name} ({child.class_level})
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {selectedChild && (
              <>
                <Input
                  placeholder="Motivation (optionnel)"
                  value={motivation}
                  onChangeText={setMotivation}
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: "top" }}
                />
                <Button
                  label={`Postuler pour ${selectedChild.first_name}`}
                  pill
                  loading={applyMutation.isPending}
                  onPress={() => applyMutation.mutate()}
                />
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
