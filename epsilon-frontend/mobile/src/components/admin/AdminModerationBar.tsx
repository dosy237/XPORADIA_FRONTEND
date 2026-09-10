import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Pressable, Text, View } from "react-native";

import { CheckCircleIcon, WarningIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as adminManagementApi from "@/services/adminManagement";
import { useAuthStore } from "@/store/authStore";

/** Barre discrète, visible uniquement par un administrateur, sur une
 * fiche publique établissement/entreprise/enseignant — jamais visible ni
 * accessible à personne d'autre. Un seul composant partagé entre les
 * trois écrans plutôt que la même logique dupliquée trois fois. */
export function AdminModerationBar({
  userId,
  isPartner,
  profileVisible,
  invalidateKey,
}: {
  userId: number;
  isPartner?: boolean;
  profileVisible?: boolean;
  invalidateKey: unknown[];
}) {
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const partnerMutation = useMutation({
    mutationFn: () => adminManagementApi.togglePartnerStatus(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invalidateKey }),
  });

  const visibilityMutation = useMutation({
    mutationFn: () => adminManagementApi.toggleProfileVisibility(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invalidateKey }),
  });

  if (currentUser?.primary_role !== "admin") return null;

  return (
    <View className="bg-xporadia-navy/[0.04] rounded-2xl p-3 flex-row items-center gap-2 flex-wrap">
      <Text className="text-[10px] font-semibold text-xporadia-text-secondary uppercase mr-1">
        Admin
      </Text>
      {isPartner !== undefined ? (
        <Pressable
          onPress={() => partnerMutation.mutate()}
          disabled={partnerMutation.isPending}
          className="flex-row items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-soft"
        >
          <CheckCircleIcon size={13} color={isPartner ? Colors.orange : Colors.textSecondary} />
          <Text className="text-[11px] font-semibold text-xporadia-text-primary">
            {isPartner ? "Retirer partenaire" : "Rendre partenaire"}
          </Text>
        </Pressable>
      ) : null}
      {profileVisible !== undefined ? (
        <Pressable
          onPress={() =>
            Alert.alert(
              profileVisible ? "Masquer ce profil ?" : "Réafficher ce profil ?",
              "Visible uniquement par vous en tant qu'administrateur.",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Confirmer", onPress: () => visibilityMutation.mutate() },
              ]
            )
          }
          disabled={visibilityMutation.isPending}
          className="flex-row items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-soft"
        >
          <WarningIcon size={13} color={profileVisible ? Colors.textSecondary : Colors.red} />
          <Text className="text-[11px] font-semibold text-xporadia-text-primary">
            {profileVisible ? "Masquer de l'annuaire" : "Réafficher"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
