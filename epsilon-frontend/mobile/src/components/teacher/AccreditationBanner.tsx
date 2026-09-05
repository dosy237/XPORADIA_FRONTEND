import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheckIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as authApi from "@/services/auth";
import * as teacherApi from "@/services/teacherProfile";

export function AccreditationBanner() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: teacherApi.fetchTeacherProfile,
  });

  const submitMutation = useMutation({
    mutationFn: () => authApi.submitPreRegistrationCode(code),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
    },
    onError: () => setError("Code invalide, déjà utilisé, ou introuvable."),
  });

  if (!profile || profile.is_documents_validated) return null;

  return (
    <View className="bg-white rounded-2xl p-5 border border-xporadia-navy/15 gap-3">
      <View className="flex-row items-center gap-2">
        <ShieldCheckIcon color={Colors.navy} size={18} />
        <Text className="text-sm font-semibold text-xporadia-navy">
          Accréditation Xporadia en attente
        </Text>
      </View>

      {profile.preregistration_code_submitted ? (
        <Text className="text-xs text-xporadia-text-secondary leading-5">
          Votre code a bien été enregistré. Votre dossier est en attente de validation par
          Xporadia. Vous serez notifié dès qu&apos;il sera accrédité. En attendant, vous pouvez
          parcourir l&apos;application avec des droits réduits (vous n&apos;apparaissez pas encore
          dans l&apos;annuaire et ne pouvez pas activer les cours particuliers ou le marché de
          l&apos;emploi).
        </Text>
      ) : (
        <>
          <Text className="text-xs text-xporadia-text-secondary leading-5">
            Pour devenir officiellement enseignant accrédité Xporadia, complétez d&apos;abord une
            formation en présentiel. Vous recevrez alors un code de préinscription à renseigner
            ici, pour validation par notre équipe.
          </Text>
          <Input
            placeholder="Code de préinscription"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            accessibilityLabel="Code de préinscription"
          />
          {error ? <Text className="text-xs text-xporadia-red">{error}</Text> : null}
          <Button
            label="Envoyer le code"
            pill
            disabled={!code}
            loading={submitMutation.isPending}
            onPress={() => submitMutation.mutate()}
          />
        </>
      )}
    </View>
  );
}
