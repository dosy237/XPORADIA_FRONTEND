import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import * as adminManagementApi from "@/services/adminManagement";
import type { AdminScope } from "@/types/user";

const SCOPE_CARDS: { value: AdminScope; title: string; description: string }[] = [
  {
    value: "full",
    title: "Administrateur complet",
    description: "Tous les droits, y compris créer et gérer d'autres administrateurs.",
  },
  {
    value: "moderation",
    title: "Modérateur",
    description: "Accréditations, bibliothèque, litiges.",
  },
  {
    value: "accounts",
    title: "Gestionnaire de comptes",
    description: "Comptes utilisateurs, création de comptes.",
  },
  {
    value: "catalog",
    title: "Gestionnaire de contenu",
    description: "Modules de formation, offres d'emploi et de stage.",
  },
];

export default function CreateAdministratorScreen() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [scope, setScope] = useState<AdminScope>("moderation");

  const createMutation = useMutation({
    mutationFn: () =>
      adminManagementApi.createAdmin({
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        admin_scope: scope,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
      Alert.alert("Compte créé", "Les identifiants ont été envoyés par email.");
      router.back();
    },
    onError: () => Alert.alert("Erreur", "Impossible de créer ce compte, email déjà utilisé ?"),
  });

  return (
    <KeyboardAwareScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Ajouter un administrateur</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Aucun compte admin ne peut s&apos;inscrire seul, seul un administrateur existant peut en
          créer un nouveau.
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-5 gap-4 shadow-soft">
        <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
        <Input label="Nom" value={lastName} onChangeText={setLastName} />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View className="gap-2">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Périmètre</Text>
          {SCOPE_CARDS.map((s) => (
            <Card key={s.value} onPress={() => setScope(s.value)} selected={scope === s.value} className="gap-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">{s.title}</Text>
              <Text className="text-xs text-xporadia-text-secondary">{s.description}</Text>
            </Card>
          ))}
        </View>

        <Button
          label="Créer le compte"
          pill
          disabled={!email.trim() || !firstName.trim() || !lastName.trim()}
          loading={createMutation.isPending}
          onPress={() => createMutation.mutate()}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}
