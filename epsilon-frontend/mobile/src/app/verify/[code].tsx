import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MedalIcon, ShieldCheckIcon } from "@/components/ui/Icon";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as certificationApi from "@/services/certification";

export default function VerifyCertificateScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-certification", code],
    queryFn: () => certificationApi.verifyCertification(code),
    enabled: !!code,
    retry: false,
  });

  return (
    <View className="flex-1 bg-xporadia-navy items-center justify-center p-8">
      {isLoading ? (
        <ActivityIndicator color={Colors.white} />
      ) : error || !data ? (
        <View className="items-center gap-3">
          <View className="h-16 w-16 rounded-full bg-white/10 items-center justify-center">
            <ShieldCheckIcon size={28} color={Colors.white} />
          </View>
          <Text className="text-white text-lg font-bold text-center">Code invalide</Text>
          <Text className="text-white/60 text-sm text-center">
            Aucune certification Xporadia ne correspond à ce code.
          </Text>
        </View>
      ) : (
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm gap-4 items-center">
          <View
            className={`h-14 w-14 rounded-full items-center justify-center ${
              data.is_valid && !data.is_expired ? "bg-xporadia-green/10" : "bg-xporadia-red/10"
            }`}
          >
            <ShieldCheckIcon size={26} color={data.is_valid && !data.is_expired ? Colors.green : Colors.red} />
          </View>

          <Text className="text-lg font-bold text-xporadia-navy text-center">
            {data.is_valid && !data.is_expired ? "Certification authentique" : "Certification non valide"}
          </Text>

          <View className="w-full gap-3 mt-2">
            <View className="flex-row items-center gap-3">
              <MedalIcon size={18} color={Colors.orange} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">{data.teacher_name}</Text>
                <Text className="text-xs text-xporadia-text-secondary">{data.module_title}</Text>
              </View>
              <Chip label={LEVEL_LABELS[data.level]} variant="orange" />
            </View>

            <View className="flex-row justify-between border-t border-xporadia-border pt-3">
              <Text className="text-xs text-xporadia-text-secondary">Délivrée le</Text>
              <Text className="text-xs font-medium text-xporadia-text-primary">
                {new Date(data.issued_at).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-xporadia-text-secondary">Valide jusqu'au</Text>
              <Text className="text-xs font-medium text-xporadia-text-primary">
                {new Date(data.expires_at).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          </View>
        </View>
      )}

      <Button label="Découvrir Xporadia" pill onPress={() => router.replace("/(tabs)/actualites")} />
    </View>
  );
}
