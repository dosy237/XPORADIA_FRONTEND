import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { StepProgress } from "@/components/ui/StepProgress";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import * as authApi from "@/services/auth";

const TOTAL_STEPS = 2;

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [done, setDone] = useState(false);

  const requestMutation = useMutation({
    mutationFn: () => authApi.requestPasswordReset(email.trim().toLowerCase()),
    onSuccess: () => setStep(2),
    onError: () => setRequestError("Une erreur est survenue. Réessayez."),
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.requestPasswordReset(email.trim().toLowerCase()),
    onSuccess: () => setResent(true),
  });

  const confirmMutation = useMutation({
    mutationFn: () => authApi.confirmPasswordReset(email.trim().toLowerCase(), code.trim(), newPassword),
    onSuccess: () => setDone(true),
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? "Code invalide ou expiré.";
      setConfirmError(detail);
    },
  });

  const passwordsMatch = newPassword.length >= 8 && newPassword === confirmPassword;

  if (done) {
    return (
      <KeyboardAwareScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="flex-grow">
        <AuthHeader title="Mot de passe mis à jour" showBack onBack={() => router.replace("/(auth)/login")} />
        <View className="px-6 pt-6 flex-1">
          <View className="bg-white rounded-2xl p-6 gap-4 shadow-soft items-center">
            <Text className="text-sm text-xporadia-text-secondary text-center">
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre
              nouveau mot de passe.
            </Text>
            <Button label="Se connecter" pill onPress={() => router.replace("/(auth)/login")} />
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-xporadia-bg"
      contentContainerClassName="pb-24"
      bottomOffset={32}
    >
      <AuthHeader
        title="Mot de passe oublié"
        subtitle="Récupérez l'accès à votre compte en 2 étapes"
        showBack
        onBack={() => (step === 2 ? setStep(1) : router.back())}
      />

      <View className="px-6 pt-6">
        <View className="bg-white rounded-2xl p-6 gap-5 shadow-soft">
          <StepProgress step={step} total={TOTAL_STEPS} />

          {step === 1 ? (
            <View className="gap-4">
              <Text className="text-sm text-xporadia-text-secondary">
                Saisissez l&apos;adresse email associée à votre compte. Nous vous enverrons un code pour
                réinitialiser votre mot de passe.
              </Text>
              <Input
                label="Email"
                value={email}
                onChangeText={(v) => {
                  setRequestError(null);
                  setEmail(v);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="vous@exemple.ci"
              />
              {requestError ? (
                <Text className="text-xporadia-red text-sm text-center">{requestError}</Text>
              ) : null}
              <Button
                label="Envoyer le code"
                pill
                disabled={!email.includes("@")}
                loading={requestMutation.isPending}
                onPress={() => {
                  setRequestError(null);
                  requestMutation.mutate();
                }}
              />
            </View>
          ) : (
            <View className="gap-4">
              <Text className="text-sm text-xporadia-text-secondary">
                Un code à 6 chiffres a été envoyé à {email}. Saisissez-le ci-dessous avec votre nouveau mot de
                passe.
              </Text>

              <OtpInput
                value={code}
                onChangeText={(v) => {
                  setConfirmError(null);
                  setCode(v);
                }}
                autoFocus
              />

              <View className="items-center flex-row justify-center gap-1">
                <Text className="text-xporadia-text-secondary text-sm">Vous n&apos;avez rien reçu ?</Text>
                <Text
                  className="text-xporadia-orange-text font-semibold text-sm"
                  onPress={() => resendMutation.mutate()}
                  suppressHighlighting
                >
                  Renvoyer le code
                </Text>
              </View>
              {resent ? (
                <Text className="text-xporadia-green text-sm text-center">Nouveau code envoyé.</Text>
              ) : null}

              <Input
                label="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="8 caractères minimum"
              />
              <Input
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Retapez le mot de passe"
                error={
                  confirmPassword.length > 0 && newPassword !== confirmPassword
                    ? "Les mots de passe ne correspondent pas."
                    : undefined
                }
              />

              {confirmError ? (
                <Text className="text-xporadia-red text-sm text-center">{confirmError}</Text>
              ) : null}

              <Button
                label="Réinitialiser le mot de passe"
                pill
                disabled={code.length !== 6 || !passwordsMatch}
                loading={confirmMutation.isPending}
                onPress={() => {
                  setConfirmError(null);
                  confirmMutation.mutate();
                }}
              />
            </View>
          )}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
