import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

export default function RegisterDirectorScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [levelsTaught, setLevelsTaught] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const mutation = useMutation({
    mutationFn: async () => {
      await authApi.registerDirector({
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        school_name: schoolName,
        address,
        levels_taught: levelsTaught
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        student_count: studentCount ? Number(studentCount) : undefined,
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

  const canSubmit = firstName && lastName && email && password.length >= 8 && schoolName && address;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-xporadia-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="p-6 gap-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xporadia-text-secondary mb-2">
          Créez un compte établissement pour accéder au vivier d&apos;enseignants certifiés.
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
        <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="8 caractères minimum"
        />
        <Input label="Nom de l'établissement" value={schoolName} onChangeText={setSchoolName} />
        <Input label="Adresse" value={address} onChangeText={setAddress} />
        <Input
          label="Niveaux enseignés"
          value={levelsTaught}
          onChangeText={setLevelsTaught}
          placeholder="Collège, Lycée, ..."
        />
        <Input
          label="Effectif d'élèves"
          value={studentCount}
          onChangeText={setStudentCount}
          keyboardType="numeric"
        />

        {formError ? <Text className="text-xporadia-red text-sm">{formError}</Text> : null}

        <View className="mt-2">
          <Button
            label="Créer mon compte"
            onPress={() => {
              setFormError(null);
              mutation.mutate();
            }}
            loading={mutation.isPending}
            disabled={!canSubmit}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
