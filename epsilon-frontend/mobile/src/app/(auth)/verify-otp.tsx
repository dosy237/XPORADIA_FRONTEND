import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

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
      router.replace(`/(app)/${data.user.primary_role}/dashboard`);
    },
    onError: () => setError("Code invalide ou expiré."),
  });

  const resendMutation = useMutation({
    mutationFn: authApi.resendOtp,
    onSuccess: () => setResent(true),
  });

  return (
    <View className="flex-1 bg-xporadia-bg p-6 justify-center gap-6">
      <View className="gap-2">
        <Text className="text-xl font-bold text-xporadia-navy">Vérifiez votre compte</Text>
        <Text className="text-xporadia-text-secondary">
          Un code à 6 chiffres a été envoyé à {user?.email ?? "votre email"}.
        </Text>
      </View>

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
        onPress={() => {
          setError(null);
          verifyMutation.mutate();
        }}
        loading={verifyMutation.isPending}
        disabled={code.length !== 6}
      />

      <View className="items-center gap-2">
        {resent ? <Text className="text-xporadia-green text-sm">Nouveau code envoyé.</Text> : null}
        <Text
          className="text-xporadia-orange font-semibold"
          onPress={() => resendMutation.mutate()}
        >
          Renvoyer le code
        </Text>
        <Text
          className="text-xporadia-text-secondary"
          onPress={() => user && router.replace(`/(app)/${user.primary_role}/dashboard`)}
        >
          Vérifier plus tard
        </Text>
      </View>
    </View>
  );
}
