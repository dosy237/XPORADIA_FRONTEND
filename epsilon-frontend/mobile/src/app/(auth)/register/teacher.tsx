import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

export default function RegisterTeacherScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [subjects, setSubjects] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const mutation = useMutation({
    mutationFn: async () => {
      await authApi.registerTeacher({
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        subjects: subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience_years: experienceYears ? Number(experienceYears) : 0,
        location,
      });
      return authApi.login(email.trim().toLowerCase(), password);
    },
    onSuccess: (data) => {
      login({ user: data.user, access: data.access, refresh: data.refresh });
      router.replace("/(auth)/verify-otp");
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.email?.[0] ?? err?.response?.data?.detail ?? "Une erreur est survenue.";
      setFormError(detail);
    },
  });

  const canSubmit = firstName && lastName && email && password.length >= 8;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-xporadia-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
        <AuthHeader title="Inscription enseignant" compact showBack />

        <View className="px-6 pt-6 gap-4">
          <Text className="text-xporadia-text-secondary -mt-2 mb-1">
            Créez votre profil enseignant pour accéder à la certification Xporadia.
          </Text>

          <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
          <Input label="Nom" value={lastName} onChangeText={setLastName} />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Téléphone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+225 07 00 00 00 00"
          />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="8 caractères minimum"
          />
          <Input
            label="Matières enseignées"
            value={subjects}
            onChangeText={setSubjects}
            placeholder="Maths, Physique, ..."
          />
          <Input
            label="Années d'expérience"
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="numeric"
          />
          <Input
            label="Localisation"
            value={location}
            onChangeText={setLocation}
            placeholder="Cocody, Abidjan"
          />

          {formError ? <Text className="text-xporadia-red text-sm">{formError}</Text> : null}

          <View className="mt-2">
            <Button
              label="Créer mon compte"
              pill
              onPress={() => {
                setFormError(null);
                mutation.mutate();
              }}
              loading={mutation.isPending}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
