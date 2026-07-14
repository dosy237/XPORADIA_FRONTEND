import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LevelBadge } from "@/components/certification/LevelBadge";
import * as certificationApi from "@/services/certification";
import * as employmentApi from "@/services/employment";

export default function JobSeekingScreen() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["my-certification-status"],
    queryFn: certificationApi.fetchMyCertificationStatus,
  });

  const { data: myRequest, isLoading: requestLoading } = useQuery({
    queryKey: ["my-job-seeking-request"],
    queryFn: employmentApi.fetchMyJobSeekingRequest,
  });

  const isGold = status?.current_level === "gold";

  const postMutation = useMutation({
    mutationFn: () => employmentApi.postJobSeekingRequest({ message, city: city || undefined }),
    onSuccess: (request) => {
      queryClient.setQueryData(["my-job-seeking-request"], request);
      setMessage("");
      setCity("");
    },
    onError: () => Alert.alert("Erreur", "Impossible de publier votre demande."),
  });

  const cancelMutation = useMutation({
    mutationFn: employmentApi.deleteMyJobSeekingRequest,
    onSuccess: () => queryClient.setQueryData(["my-job-seeking-request"], null),
  });

  if (statusLoading || requestLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!isGold) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-4">
        <LevelBadge level="gold" size={56} />
        <Text className="text-base font-semibold text-xporadia-text-primary text-center">
          Privilège réservé au niveau Or
        </Text>
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Publier une demande d&apos;emploi à tout moment est un privilège des enseignants ayant
          atteint le niveau de certification Or. Continuez votre parcours pour y accéder.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        En tant qu&apos;enseignant(e) Or, vous pouvez publier une demande d&apos;emploi visible par
        les établissements à tout moment.
      </Text>

      {myRequest ? (
        <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-3">
          <Text className="text-sm font-semibold text-xporadia-text-primary">Demande active</Text>
          <Text className="text-sm text-xporadia-text-secondary">{myRequest.message}</Text>
          {myRequest.city ? (
            <Text className="text-xs text-xporadia-text-secondary">{myRequest.city}</Text>
          ) : null}
          <Button
            label="Retirer ma demande"
            variant="secondary"
            pill
            loading={cancelMutation.isPending}
            onPress={() => cancelMutation.mutate()}
          />
        </View>
      ) : (
        <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
          <Input
            label="Votre message"
            value={message}
            onChangeText={setMessage}
            placeholder="Enseignant expérimenté, disponible immédiatement..."
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top" }}
          />
          <Input label="Ville (optionnel)" value={city} onChangeText={setCity} placeholder="Abidjan" />
          <Button
            label="Publier ma demande"
            pill
            disabled={!message}
            loading={postMutation.isPending}
            onPress={() => postMutation.mutate()}
          />
        </View>
      )}
    </ScrollView>
  );
}
