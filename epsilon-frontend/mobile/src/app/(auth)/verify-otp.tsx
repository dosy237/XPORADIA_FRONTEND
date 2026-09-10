import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import * as academicsApi from "@/services/academics";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

export default function VerifyOtpScreen() {
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const redirectAfterVerification = async () => {
    if (inviteToken) {
      try {
        const subject = await academicsApi.acceptInvitation(inviteToken);
        router.replace({
          pathname: "/(app)/teacher/subject/[subjectId]",
          params: { subjectId: String(subject.id), editable: "1" },
        });
        return;
      } catch {
        router.replace({ pathname: "/invite/[token]", params: { token: inviteToken } });
        return;
      }
    }
    if (user?.primary_role === "student") {
      router.replace("/(auth)/join-establishment");
      return;
    }
    router.replace("/(tabs)/me");
  };

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOtp(code.trim()),
    onSuccess: () => {
      updateUser({ is_verified: true });
      redirectAfterVerification();
    },
    onError: () => setError("Code invalide ou expiré."),
  });

  const resendMutation = useMutation({
    mutationFn: authApi.resendOtp,
    onSuccess: () => setResent(true),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="pb-10 flex-grow">
      <AuthHeader
        title="Vérifiez votre compte"
        subtitle={`Un code à 6 chiffres a été envoyé à ${user?.email ?? "votre adresse email"}`}
        showBack
      />

      <View className="px-6 pt-6">
        <View className="bg-white rounded-2xl p-6 gap-6 shadow-soft">
          <OtpInput value={code} onChangeText={(v) => { setError(null); setCode(v); }} autoFocus />

          {error ? <Text className="text-xporadia-red text-sm text-center">{error}</Text> : null}
          {resent ? <Text className="text-xporadia-green text-sm text-center">Nouveau code envoyé.</Text> : null}

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

          <View className="items-center flex-row justify-center gap-1">
            <Text className="text-xporadia-text-secondary text-sm">Vous n'avez rien reçu ?</Text>
            <Text
              className="text-xporadia-orange-text font-semibold text-sm"
              onPress={() => resendMutation.mutate()}
              suppressHighlighting
            >
              Renvoyer le code
            </Text>
          </View>
        </View>

        {user ? (
          <Text
            className="text-xporadia-text-secondary text-center text-sm mt-5"
            onPress={() => redirectAfterVerification()}
            suppressHighlighting
          >
            Vérifier plus tard
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
