import { useMutation } from "@tanstack/react-query";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { SocialButton } from "@/components/ui/SocialButton";
import * as academicsApi from "@/services/academics";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

export default function LoginScreen() {
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const mutation = useMutation({
    mutationFn: () => authApi.login(email.trim().toLowerCase(), password),
    onSuccess: async (data) => {
      login({ user: data.user, access: data.access, refresh: data.refresh });

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
      router.replace("/(tabs)/me");
    },
    onError: () => setFormError("Email ou mot de passe incorrect."),
  });

  const notifySocialSoon = (provider: string) =>
    Alert.alert("Bientôt disponible", `La connexion avec ${provider} arrive prochainement.`);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-xporadia-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10 flex-grow">
        <AuthHeader title="Ravi de vous revoir" subtitle="Connectez-vous pour retrouver votre espace" showBack />

        <View className="px-6 pt-6">
          <View className="bg-white rounded-2xl p-6 gap-5 shadow-soft">
            <View className="gap-4">
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="vous@exemple.ci"
              />
              <Input
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />
            </View>

            <Pressable
              onPress={() =>
                Alert.alert("Bientôt disponible", "La réinitialisation du mot de passe arrive prochainement.")
              }
              hitSlop={8}
              className="self-end -mt-2"
            >
              <Text className="text-xporadia-orange-text text-sm font-medium">Mot de passe oublié ?</Text>
            </Pressable>

            {formError ? <Text className="text-xporadia-red text-sm text-center">{formError}</Text> : null}

            <Button
              label="Se connecter"
              pill
              onPress={() => {
                setFormError(null);
                mutation.mutate();
              }}
              loading={mutation.isPending}
            />

            <Divider label="ou continuer avec" />

            <View className="flex-row gap-3">
              <SocialButton label="Google" onPress={() => notifySocialSoon("Google")} />
              <SocialButton label="Apple" onPress={() => notifySocialSoon("Apple")} />
            </View>
          </View>

          <View className="items-center gap-1 flex-row justify-center mt-6">
            <Text className="text-xporadia-text-secondary">Pas encore de compte ?</Text>
            <Link href="/(auth)/register" asChild>
              <Text className="text-xporadia-orange-text font-semibold"> Créer un compte</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
