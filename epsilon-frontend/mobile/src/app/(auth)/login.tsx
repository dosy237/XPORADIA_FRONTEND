import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const mutation = useMutation({
    mutationFn: () => authApi.login(email.trim().toLowerCase(), password),
    onSuccess: (data) => {
      login({ user: data.user, access: data.access, refresh: data.refresh });
      router.replace(`/(app)/${data.user.primary_role}/dashboard`);
    },
    onError: () => setFormError("Email ou mot de passe incorrect."),
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-xporadia-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-10 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-xporadia-navy">Xporadia</Text>
          <Text className="text-xporadia-text-secondary text-center">
            Connectez-vous pour accéder à votre espace
          </Text>
        </View>

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
          {formError ? <Text className="text-xporadia-red text-sm">{formError}</Text> : null}
          <Button
            label="Se connecter"
            onPress={() => {
              setFormError(null);
              mutation.mutate();
            }}
            loading={mutation.isPending}
          />
        </View>

        <View className="items-center gap-2">
          <Text className="text-xporadia-text-secondary">Pas encore de compte ?</Text>
          <Link href="/(auth)/register" asChild>
            <Text className="text-xporadia-orange font-semibold">Créer un compte</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
