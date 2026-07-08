import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import { dashboardPathForRole } from "@/utils/roleRouting";

export default function VerifyOtpScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOtp(code.trim()),
    onSuccess: (data) => {
      updateUser({ is_verified: true });
      router.replace(dashboardPathForRole(data.user.primary_role));
    },
    onError: () => setError("Code invalide ou expiré."),
  });

  const resendMutation = useMutation({
    mutationFn: authApi.resendOtp,
    onSuccess: () => setResent(true),
  });

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="pb-10">
      <AuthHeader title="Vérifiez votre compte" subtitle={`Un code a été envoyé à ${user?.email ?? "votre email"}`} />

      <View className="px-6 gap-4 mt-4">
        <Input
          label="Code de vérification"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          placeholder="000000"
          maxLength={6}
        />
        {error ? <Text className="text-xporadia-red text-sm">{error}</Text> : null}

        <Button
          label="Vérifier"
          pill
          onPress={() => {
            setError(null);
            verifyMutation.mutate();
          }}
          loading={verifyMutation.isPending}
          disabled={code.length !== 6}
        />

        <View className="items-center gap-2">
          {resent ? <Text className="text-xporadia-green text-sm">Nouveau code envoyé.</Text> : null}
          <Text className="text-xporadia-orange font-semibold" onPress={() => resendMutation.mutate()}>
            Renvoyer le code
          </Text>
          <Text
            className="text-xporadia-text-secondary"
            onPress={() => user && router.replace(dashboardPathForRole(user.primary_role))}
          >
            Vérifier plus tard
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
