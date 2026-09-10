import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { BuildingIcon, SearchIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as establishmentDirectoryApi from "@/services/establishmentDirectory";
import * as gradingApi from "@/services/grading";
import { useAuthStore } from "@/store/authStore";

export default function JoinEstablishmentScreen() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [otherName, setOtherName] = useState("");
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: results, isLoading } = useQuery({
    queryKey: ["establishment-search", search],
    queryFn: () => establishmentDirectoryApi.fetchEstablishmentDirectory(search),
    enabled: search.trim().length >= 2,
  });

  const mutation = useMutation({
    mutationFn: (payload: { establishment?: number; other_establishment_name?: string }) =>
      gradingApi.submitJoinRequest(payload),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-8 gap-4">
        <View className="h-16 w-16 rounded-full bg-xporadia-orange/10 items-center justify-center">
          <BuildingIcon size={28} color={Colors.orange} />
        </View>
        <Text className="text-lg font-bold text-xporadia-navy text-center">Demande envoyée</Text>
        <Text className="text-sm text-xporadia-text-secondary text-center leading-5">
          Votre établissement va examiner votre demande. Vous serez notifié(e) dès qu&apos;elle sera
          traitée.
        </Text>
        <Button label="Accéder à mon espace" pill onPress={() => router.replace("/(tabs)/actualites")} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="pb-10 flex-grow">
      <AuthHeader
        title="Rejoindre mon établissement"
        subtitle="Recherchez votre établissement pour être rattaché(e) à votre classe."
      />

      <View className="px-6 pt-6 gap-4">
        <View className="bg-white rounded-2xl p-5 shadow-soft gap-4">
          <Input
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              setShowOtherForm(false);
            }}
            placeholder="Nom de votre établissement..."
            leftIcon={<SearchIcon size={16} color={Colors.textSecondary} />}
          />

          {isLoading && search.trim().length >= 2 ? (
            <ActivityIndicator color={Colors.navy} />
          ) : search.trim().length >= 2 ? (
            <View className="gap-2">
              {(results ?? []).map((establishment) => (
                <Pressable
                  key={establishment.id}
                  onPress={() => mutation.mutate({ establishment: establishment.id })}
                  disabled={mutation.isPending}
                  className="flex-row items-center gap-3 bg-xporadia-bg rounded-xl p-3"
                >
                  <View className="h-9 w-9 rounded-full bg-white items-center justify-center shadow-soft">
                    <BuildingIcon size={16} color={Colors.navy} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-xporadia-text-primary">
                      {establishment.school_name}
                    </Text>
                    <Text className="text-xs text-xporadia-text-secondary" numberOfLines={1}>
                      {establishment.address}
                    </Text>
                  </View>
                </Pressable>
              ))}

              {!showOtherForm ? (
                <Pressable onPress={() => setShowOtherForm(true)} className="py-2">
                  <Text className="text-xs font-semibold text-xporadia-orange-text text-center">
                    Mon établissement n&apos;est pas dans la liste
                  </Text>
                </Pressable>
              ) : (
                <View className="gap-2 pt-1">
                  <Input
                    value={otherName}
                    onChangeText={setOtherName}
                    placeholder="Nom exact de votre établissement"
                  />
                  <Button
                    label="Envoyer la demande"
                    pill
                    disabled={!otherName.trim() || mutation.isPending}
                    loading={mutation.isPending}
                    onPress={() => mutation.mutate({ other_establishment_name: otherName.trim() })}
                  />
                  <Text className="text-[11px] text-xporadia-text-secondary text-center leading-4">
                    Votre demande restera en attente jusqu&apos;à ce que cet établissement rejoigne
                    Xporadia.
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {mutation.isError ? (
            <Text className="text-xs text-xporadia-red text-center">
              Une erreur est survenue. Réessayez.
            </Text>
          ) : null}
        </View>

        <Text
          className="text-sm text-xporadia-text-secondary text-center"
          onPress={() => router.replace("/(tabs)/actualites")}
          suppressHighlighting
        >
          Plus tard — je n&apos;ai pas accès aux fonctionnalités de ma classe tant que je n&apos;ai
          pas rejoint mon établissement.
        </Text>
      </View>
    </ScrollView>
  );
}
