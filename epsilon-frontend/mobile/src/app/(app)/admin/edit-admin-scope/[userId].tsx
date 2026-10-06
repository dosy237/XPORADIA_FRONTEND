import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import * as adminUsersApi from "@/services/adminUsers";
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

export default function EditAdminScopeScreen() {
  const { userId, name, currentScope } = useLocalSearchParams<{
    userId: string;
    name?: string;
    currentScope?: string;
  }>();
  const id = Number(userId);
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<AdminScope>((currentScope as AdminScope) ?? "moderation");

  const mutation = useMutation({
    mutationFn: () => adminUsersApi.promoteToAdmin(id, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
      Alert.alert("Périmètre mis à jour", "Le compte garde le même identifiant, seul son périmètre a changé.");
      router.back();
    },
    onError: () => Alert.alert("Erreur", "Impossible de modifier ce périmètre."),
  });

  return (
    <View className="flex-1 bg-xporadia-bg p-6 gap-5">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Modifier le périmètre</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          {name ? `${name}, ` : ""}ceci modifie uniquement le périmètre de ce compte admin, il n&apos;est
          ni supprimé ni recréé.
        </Text>
      </View>

      <View className="gap-2">
        {SCOPE_CARDS.map((s) => (
          <Card key={s.value} onPress={() => setScope(s.value)} selected={scope === s.value} className="gap-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">{s.title}</Text>
            <Text className="text-xs text-xporadia-text-secondary">{s.description}</Text>
          </Card>
        ))}
      </View>

      <Button label="Enregistrer" pill loading={mutation.isPending} onPress={() => mutation.mutate()} />
    </View>
  );
}
