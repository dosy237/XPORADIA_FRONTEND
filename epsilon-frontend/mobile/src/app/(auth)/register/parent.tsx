import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

interface ChildForm {
  firstName: string;
  classLevel: string;
  targetSubjects: string;
}

const emptyChild = (): ChildForm => ({ firstName: "", classLevel: "", targetSubjects: "" });

export default function RegisterParentScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [children, setChildren] = useState<ChildForm[]>([emptyChild()]);
  const [formError, setFormError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const updateChild = (index: number, patch: Partial<ChildForm>) => {
    setChildren((prev) => prev.map((child, i) => (i === index ? { ...child, ...patch } : child)));
  };

  const addChild = () => {
    if (children.length >= 5) return;
    setChildren((prev) => [...prev, emptyChild()]);
  };

  const removeChild = (index: number) => {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await authApi.registerParent({
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        location,
        children: children
          .filter((c) => c.firstName && c.classLevel)
          .map((c) => ({
            first_name: c.firstName,
            class_level: c.classLevel,
            target_subjects: c.targetSubjects
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          })),
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
        <AuthHeader title="Inscription parent" compact showBack />

        <View className="px-6 pt-6 gap-4">
          <Text className="text-xporadia-text-secondary -mt-2 mb-1">
            Créez votre compte parent pour trouver des enseignants certifiés pour vos enfants.
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
          <Input label="Localisation" value={location} onChangeText={setLocation} placeholder="Marcory" />

          <View className="gap-3 mt-2">
            <Text className="font-semibold text-xporadia-text-primary">
              Vos enfants ({children.length}/5)
            </Text>
            {children.map((child, index) => (
              <Card key={index} className="gap-3">
                <View className="flex-row justify-between items-center">
                  <Text className="font-medium text-xporadia-text-primary">Enfant {index + 1}</Text>
                  {children.length > 1 ? (
                    <Pressable onPress={() => removeChild(index)}>
                      <Text className="text-xporadia-red text-sm">Retirer</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Input
                  label="Prénom de l'enfant"
                  value={child.firstName}
                  onChangeText={(v) => updateChild(index, { firstName: v })}
                />
                <Input
                  label="Classe"
                  value={child.classLevel}
                  onChangeText={(v) => updateChild(index, { classLevel: v })}
                  placeholder="3eme, Terminale D, ..."
                />
                <Input
                  label="Matières cibles"
                  value={child.targetSubjects}
                  onChangeText={(v) => updateChild(index, { targetSubjects: v })}
                  placeholder="Maths, Anglais, ..."
                />
              </Card>
            ))}
            {children.length < 5 ? (
              <Button label="Ajouter un enfant" variant="secondary" pill onPress={addChild} />
            ) : null}
          </View>

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
