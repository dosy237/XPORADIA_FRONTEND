import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SearchIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as parentApi from "@/services/parentProfile";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente d'approbation",
  approved: "Approuvée",
  rejected: "Rejetée",
};

export default function ClaimChildScreen() {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const { data: found, isLoading, isError } = useQuery({
    queryKey: ["search-unclaimed-child", searchedEmail],
    queryFn: () => parentApi.searchUnclaimedChild(searchedEmail!),
    enabled: !!searchedEmail,
  });

  const { data: myClaims } = useQuery({
    queryKey: ["my-child-claim-requests"],
    queryFn: parentApi.fetchMyChildClaimRequests,
  });

  const submitMutation = useMutation({
    mutationFn: (childId: number) => parentApi.submitChildClaimRequest(childId),
    onSuccess: () => setSent(true),
    onError: () => Alert.alert("Erreur", "Impossible d'envoyer cette demande."),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Réclamer un enfant</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Votre enfant a créé son propre compte élève ? Recherchez-le par son email — il devra
          approuver votre demande avant que vous puissiez suivre sa scolarité.
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
        <Input
          label="Email de votre enfant"
          value={email}
          onChangeText={setEmail}
          placeholder="enfant@exemple.ci"
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<SearchIcon size={16} color={Colors.textSecondary} />}
        />
        <Button
          label="Rechercher"
          pill
          disabled={!email.trim() || isLoading}
          loading={isLoading}
          onPress={() => {
            setSent(false);
            setSearchedEmail(email.trim().toLowerCase());
          }}
        />

        {searchedEmail && !isLoading && !isError ? (
          found ? (
            <View className="bg-xporadia-bg rounded-xl p-3 gap-2">
              <View className="flex-row items-center gap-3">
                <Avatar firstName={found.first_name} lastName={found.last_name} size={36} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-xporadia-text-primary">
                    {found.first_name} {found.last_name}
                  </Text>
                  <Text className="text-xs text-xporadia-text-secondary">{found.class_level}</Text>
                </View>
              </View>
              {sent ? (
                <Chip label="Demande envoyée" variant="navy-subtle" />
              ) : (
                <Button
                  label="Envoyer la demande"
                  pill
                  loading={submitMutation.isPending}
                  onPress={() => submitMutation.mutate(found.id)}
                />
              )}
            </View>
          ) : (
            <Text className="text-xs text-xporadia-text-secondary text-center py-2">
              Aucun élève non rattaché ne correspond à cet email.
            </Text>
          )
        ) : null}
      </View>

      {myClaims && myClaims.length > 0 && (
        <View className="gap-3">
          <Text className="text-base font-bold text-xporadia-navy">Mes demandes</Text>
          {myClaims.map((claim) => (
            <View key={claim.id} className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center justify-between">
              <Text className="text-sm text-xporadia-text-primary">
                {claim.child_first_name} {claim.child_last_name}
              </Text>
              <Chip
                label={STATUS_LABELS[claim.status]}
                variant={claim.status === "approved" ? "navy-subtle" : claim.status === "rejected" ? "neutral" : "orange"}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
