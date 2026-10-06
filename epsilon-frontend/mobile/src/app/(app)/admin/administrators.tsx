import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popup } from "@/components/ui/Popup";
import { Colors } from "@/constants/theme";
import { ADMIN_SCOPE_LABELS } from "@/lib/adminScope";
import * as adminManagementApi from "@/services/adminManagement";
import type { AdminUser } from "@/services/adminManagement";
import * as adminUsersApi from "@/services/adminUsers";
import { useAuthStore } from "@/store/authStore";
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

function ScopePicker({ value, onChange }: { value: AdminScope; onChange: (v: AdminScope) => void }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Périmètre</Text>
      {SCOPE_CARDS.map((s) => (
        <Card key={s.value} onPress={() => onChange(s.value)} selected={value === s.value} className="gap-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">{s.title}</Text>
          <Text className="text-xs text-xporadia-text-secondary">{s.description}</Text>
        </Card>
      ))}
    </View>
  );
}

export default function AdministratorsScreen() {
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-list"],
    queryFn: adminManagementApi.fetchAdminList,
  });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [scope, setScope] = useState<AdminScope>("moderation");
  const [editScope, setEditScope] = useState<AdminScope>("moderation");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-list"] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      adminManagementApi.createAdmin({
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        admin_scope: scope,
      }),
    onSuccess: () => {
      invalidate();
      setEmail("");
      setFirstName("");
      setLastName("");
      setScope("moderation");
      setCreating(false);
      Alert.alert("Compte créé", "Les identifiants ont été envoyés par email.");
    },
    onError: () => Alert.alert("Erreur", "Impossible de créer ce compte, email déjà utilisé ?"),
  });

  const editMutation = useMutation({
    mutationFn: (userId: number) => adminUsersApi.promoteToAdmin(userId, editScope),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      Alert.alert("Périmètre mis à jour", "Le compte n'a pas été recréé, seul son périmètre a changé.");
    },
    onError: () => Alert.alert("Erreur", "Impossible de modifier ce périmètre."),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: number) => adminManagementApi.suspendAdmin(userId),
    onSuccess: invalidate,
    onError: () => Alert.alert("Erreur", "Impossible de suspendre ce compte."),
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: number) => adminManagementApi.reactivateAdmin(userId),
    onSuccess: invalidate,
    onError: () => Alert.alert("Erreur", "Impossible de réactiver ce compte."),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => adminManagementApi.deleteAdmin(userId),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
    onError: () => Alert.alert("Erreur", "Impossible de supprimer ce compte."),
  });

  const confirmDelete = (admin: AdminUser) => {
    Alert.alert(
      "Supprimer cet administrateur ?",
      `${admin.first_name} ${admin.last_name} perdra définitivement son accès administrateur.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate(admin.id) },
      ]
    );
  };

  return (
    <View className="flex-1 bg-xporadia-bg">
      <ScrollView contentContainerClassName="p-6 gap-4 pb-24">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-xporadia-navy">Administrateurs</Text>
          <Text className="text-sm text-xporadia-text-secondary leading-5">
            Aucun compte admin ne peut s&apos;inscrire seul, seul un administrateur existant peut en
            créer un nouveau.
          </Text>
        </View>

        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : (
          <View className="gap-3">
            {(admins ?? []).map((a) => {
              const isMe = a.id === me?.id;
              return (
                <View key={a.id} className="bg-white rounded-2xl p-4 shadow-soft gap-3">
                  <View className="flex-row items-center gap-3">
                    <Avatar firstName={a.first_name} lastName={a.last_name} size={40} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-xporadia-text-primary">
                        {a.first_name} {a.last_name} {isMe ? "(vous)" : ""}
                      </Text>
                      <Text className="text-xs text-xporadia-text-secondary">{a.email}</Text>
                    </View>
                    <Chip
                      label={ADMIN_SCOPE_LABELS[a.admin_scope]}
                      variant={a.admin_scope === "full" ? "orange" : "navy-subtle"}
                    />
                  </View>

                  <View className="flex-row items-center gap-2">
                    {!a.is_active && <Chip label="Suspendu" variant="orange" />}
                    <View className="flex-1" />
                    {!isMe && (
                      <>
                        <Pressable
                          onPress={() => (a.is_active ? suspendMutation.mutate(a.id) : reactivateMutation.mutate(a.id))}
                          accessibilityRole="button"
                          accessibilityLabel={a.is_active ? "Suspendre" : "Réactiver"}
                          className="px-3 py-2 rounded-full bg-xporadia-bg"
                        >
                          <Text className="text-xs font-semibold text-xporadia-text-secondary">
                            {a.is_active ? "Suspendre" : "Réactiver"}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setEditScope(a.admin_scope);
                            setEditing(a);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Modifier ${a.first_name} ${a.last_name}`}
                          className="h-9 w-9 rounded-full bg-xporadia-bg items-center justify-center"
                        >
                          <PencilIcon size={15} color={Colors.navy} />
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDelete(a)}
                          accessibilityRole="button"
                          accessibilityLabel={`Supprimer ${a.first_name} ${a.last_name}`}
                          className="h-9 w-9 rounded-full bg-xporadia-red/10 items-center justify-center"
                        >
                          <TrashIcon size={15} />
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setCreating(true)}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un administrateur"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-xporadia-orange items-center justify-center shadow-deep-orange"
      >
        <PlusIcon size={22} />
      </Pressable>

      <Popup visible={creating} onClose={() => setCreating(false)}>
        <View className="gap-5">
          <Text className="text-xl font-bold text-xporadia-navy">Ajouter un administrateur</Text>
          <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
          <Input label="Nom" value={lastName} onChangeText={setLastName} />
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <ScopePicker value={scope} onChange={setScope} />
          <Button
            label="Créer le compte"
            pill
            disabled={!email.trim() || !firstName.trim() || !lastName.trim()}
            loading={createMutation.isPending}
            onPress={() => createMutation.mutate()}
          />
        </View>
      </Popup>

      <Popup visible={!!editing} onClose={() => setEditing(null)}>
        <View className="gap-5">
          <Text className="text-xl font-bold text-xporadia-navy">
            {editing ? `${editing.first_name} ${editing.last_name}` : ""}
          </Text>
          <ScopePicker value={editScope} onChange={setEditScope} />
          <Button
            label="Enregistrer"
            pill
            loading={editMutation.isPending}
            onPress={() => editing && editMutation.mutate(editing.id)}
          />
        </View>
      </Popup>
    </View>
  );
}
