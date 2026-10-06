import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { UserPlusIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { ADMIN_SCOPE_LABELS } from "@/lib/adminScope";
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

export default function AdministratorsScreen() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [scope, setScope] = useState<AdminScope>("moderation");

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-list"],
    queryFn: adminManagementApi.fetchAdminList,
  });

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
      setEmail("");
      setFirstName("");
      setLastName("");
      setScope("moderation");
      setCreating(false);
      Alert.alert("Compte créé", "Les identifiants ont été envoyés par email.");
    },
    onError: () => Alert.alert("Erreur", "Impossible de créer ce compte — email déjà utilisé ?"),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Administrateurs</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Aucun compte admin ne peut s&apos;inscrire seul — seul un administrateur existant peut en
          créer un nouveau.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : (
        <View className="gap-3">
          {(admins ?? []).map((a) => (
            <View key={a.id} className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3">
              <Avatar firstName={a.first_name} lastName={a.last_name} size={40} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  {a.first_name} {a.last_name}
                </Text>
                <Text className="text-xs text-xporadia-text-secondary">{a.email}</Text>
              </View>
              <Chip
                label={ADMIN_SCOPE_LABELS[a.admin_scope]}
                variant={a.admin_scope === "full" ? "orange" : "navy-subtle"}
              />
            </View>
          ))}
        </View>
      )}

      {creating ? (
        <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
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
              <Card
                key={s.value}
                onPress={() => setScope(s.value)}
                selected={scope === s.value}
                className="gap-1"
              >
                <Text className="text-sm font-semibold text-xporadia-text-primary">{s.title}</Text>
                <Text className="text-xs text-xporadia-text-secondary">{s.description}</Text>
              </Card>
            ))}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setCreating(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Créer"
                pill
                disabled={!email.trim() || !firstName.trim() || !lastName.trim()}
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
              />
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setCreating(true)}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un administrateur"
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5 shadow-deep-orange"
        >
          <UserPlusIcon size={16} color={Colors.white} />
          <Text className="text-white font-semibold">Ajouter un administrateur</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
