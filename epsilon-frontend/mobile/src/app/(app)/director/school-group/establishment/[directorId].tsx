import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { BuildingIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as directorProfileApi from "@/services/directorProfile";
import { useAuthStore } from "@/store/authStore";

/** Vue en lecture seule des chiffres d'un établissement membre du même
 * groupe scolaire — jamais une bascule d'identité (un compte directeur
 * reste rattaché à UN SEUL établissement) : un membre consulte les
 * chiffres d'un établissement voisin, il ne devient jamais son
 * administrateur. Les données viennent du tableau de bord de groupe déjà
 * chargé, jamais un accès direct au profil d'un autre directeur. */
export default function GroupEstablishmentSummaryScreen() {
  const { directorId } = useLocalSearchParams<{ directorId: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: group } = useQuery({
    queryKey: ["my-school-group"],
    queryFn: directorProfileApi.fetchMySchoolGroup,
  });

  const establishment = group?.establishments.find((e) => String(e.director_id) === directorId);
  const isMine = establishment?.director_id === user?.id;

  return (
    <View className="flex-1 bg-xporadia-bg p-6 gap-4">
      {!establishment ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-10">
          Établissement introuvable dans ce groupe.
        </Text>
      ) : (
        <>
          <Card className="flex-row items-center gap-3">
            {establishment.logo ? (
              <Image source={{ uri: establishment.logo }} className="h-14 w-14 rounded-2xl" />
            ) : (
              <View className="h-14 w-14 rounded-2xl bg-xporadia-navy/10 items-center justify-center">
                <BuildingIcon size={24} color={Colors.navy} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-lg font-bold text-xporadia-navy">{establishment.school_name}</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                {isMine ? "Votre établissement" : "Établissement membre du groupe"}
              </Text>
            </View>
          </Card>

          <View className="flex-row gap-3">
            <Card className="flex-1 items-center gap-1">
              <UsersIcon size={18} color={Colors.orange} />
              <Text className="text-2xl font-extrabold text-xporadia-navy">{establishment.student_count}</Text>
              <Text className="text-[11px] text-xporadia-text-secondary text-center">Élèves actifs</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-extrabold text-xporadia-orange">
                {establishment.pending_join_requests}
              </Text>
              <Text className="text-[11px] text-xporadia-text-secondary text-center">
                Demandes de rattachement en attente
              </Text>
            </Card>
          </View>

          {isMine ? (
            <Card onPress={() => router.push("/(app)/director/dashboard")} className="gap-1">
              <Text className="text-sm font-semibold text-xporadia-orange-text">
                Ouvrir mon tableau de bord complet →
              </Text>
            </Card>
          ) : (
            <Text className="text-xs text-xporadia-text-secondary leading-5">
              Vue consolidée en lecture seule — la gestion de cet établissement reste réservée à son
              propre directeur.
            </Text>
          )}
        </>
      )}
    </View>
  );
}
