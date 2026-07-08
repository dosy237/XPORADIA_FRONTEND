import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { SocialButton } from "@/components/ui/SocialButton";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import { dashboardPathForRole } from "@/utils/roleRouting";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const mutation = useMutation({
    mutationFn: () => authApi.login(email.trim().toLowerCase(), password),
    onSuccess: (data) => {
      login({ user: data.user, access: data.access, refresh: data.refresh });
      router.replace(dashboardPathForRole(data.user.primary_role));
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
        <AuthHeader title="Connexion" subtitle="Accédez à votre espace Xporadia" />

        <View className="px-6 pt-4">
          <View className="bg-white rounded-2xl p-6 gap-4 shadow-card border border-xporadia-border">
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
            {formError ? <Text className="text-xporadia-red text-sm">{formError}</Text> : null}

            <Button
              label="Se connecter"
              pill
              onPress={() => {
                setFormError(null);
                mutation.mutate();
              }}
              loading={mutation.isPending}
            />

            <Divider label="ou" />

            <View className="flex-row gap-3">
              <SocialButton label="Google" onPress={() => notifySocialSoon("Google")} />
              <SocialButton label="Apple" onPress={() => notifySocialSoon("Apple")} />
            </View>
          </View>

          <View className="items-center gap-1 flex-row justify-center mt-4">
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
