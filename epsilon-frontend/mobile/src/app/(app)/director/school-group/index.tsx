import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BuildingIcon, UsersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as directorProfileApi from "@/services/directorProfile";
import { useAuthStore } from "@/store/authStore";

function EstablishmentCard({
  establishment,
  isMine,
}: {
  establishment: directorProfileApi.SchoolGroupEstablishment;
  isMine: boolean;
}) {
  return (
    <Card
      onPress={() =>
        router.push({
          pathname: "/(app)/director/school-group/establishment/[directorId]",
          params: { directorId: String(establishment.director_id) },
        })
      }
      className="flex-row items-center gap-3"
    >
      {establishment.logo ? (
        <Image source={{ uri: establishment.logo }} className="h-12 w-12 rounded-2xl" />
      ) : (
        <View className="h-12 w-12 rounded-2xl bg-xporadia-navy/10 items-center justify-center">
          <BuildingIcon size={20} color={Colors.navy} />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        {isMine ? (
          <Text className="text-[10px] font-bold text-xporadia-orange-text uppercase">Vous</Text>
        ) : null}
        <Text className="text-sm font-semibold text-xporadia-text-primary">{establishment.school_name}</Text>
        <Text className="text-xs text-xporadia-text-secondary">
          {establishment.student_count} élève{establishment.student_count !== 1 ? "s" : ""}
          {establishment.pending_join_requests > 0
            ? ` · ${establishment.pending_join_requests} demande${establishment.pending_join_requests !== 1 ? "s" : ""} en attente`
            : ""}
        </Text>
      </View>
    </Card>
  );
}

function CreateGroupForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: () => directorProfileApi.createSchoolGroup(name.trim()),
    onSuccess: (group) => {
      queryClient.setQueryData(["my-school-group"], group);
      setName("");
    },
  });

  return (
    <Card className="gap-3">
      <Text className="text-base font-semibold text-xporadia-text-primary">Créer un groupe scolaire</Text>
      <Text className="text-sm text-xporadia-text-secondary leading-5">
        Réunissez plusieurs établissements pour suivre leurs chiffres consolidés en un seul endroit.
        Votre établissement reste indépendant tant que vous ne créez ou ne rejoignez pas de groupe.
      </Text>
      <Input label="Nom du groupe" value={name} onChangeText={setName} placeholder="Groupe Scolaire La Réussite" />
      <Button
        label="Créer le groupe"
        pill
        disabled={!name.trim()}
        loading={createMutation.isPending}
        onPress={() => createMutation.mutate()}
      />
    </Card>
  );
}

function InviteForm({ isFounder }: { isFounder: boolean }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const inviteMutation = useMutation({
    mutationFn: () => directorProfileApi.inviteToSchoolGroup(email.trim().toLowerCase()),
    onSuccess: () => {
      setEmail("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["my-school-group"] });
    },
    onError: () => setError("Vérifiez l'email : il doit correspondre à un directeur sans groupe déjà rattaché."),
  });

  if (!isFounder) return null;

  return (
    <Card className="gap-3">
      <Text className="text-base font-semibold text-xporadia-text-primary">Inviter un établissement</Text>
      <Input
        label="Email du directeur"
        value={email}
        onChangeText={setEmail}
        placeholder="directeur@exemple.ci"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {error ? <Text className="text-xs text-xporadia-red">{error}</Text> : null}
      <Button
        label="Envoyer l'invitation"
        pill
        disabled={!email.trim()}
        loading={inviteMutation.isPending}
        onPress={() => inviteMutation.mutate()}
      />
    </Card>
  );
}

export default function SchoolGroupScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: group, isLoading } = useQuery({
    queryKey: ["my-school-group"],
    queryFn: directorProfileApi.fetchMySchoolGroup,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-sm text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
        <CreateGroupForm />
      </ScrollView>
    );
  }

  const totalStudents = group.establishments.reduce((sum, e) => sum + e.student_count, 0);
  const totalPending = group.establishments.reduce((sum, e) => sum + e.pending_join_requests, 0);
  const isFounder = group.created_by === user?.id;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">{group.name}</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Fondé par {group.established_by} · {group.establishments.length} établissement
          {group.establishments.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Card className="flex-1 items-center gap-1">
          <UsersIcon size={18} color={Colors.orange} />
          <Text className="text-2xl font-extrabold text-xporadia-navy">{totalStudents}</Text>
          <Text className="text-[11px] text-xporadia-text-secondary text-center">
            Élèves au total dans le groupe
          </Text>
        </Card>
        <Card className="flex-1 items-center gap-1">
          <Text className="text-2xl font-extrabold text-xporadia-orange">{totalPending}</Text>
          <Text className="text-[11px] text-xporadia-text-secondary text-center">
            Demandes de rattachement en attente, tous établissements
          </Text>
        </Card>
      </View>

      <View className="gap-2">
        {group.establishments.map((establishment) => (
          <EstablishmentCard
            key={establishment.id}
            establishment={establishment}
            isMine={establishment.director_id === user?.id}
          />
        ))}
      </View>

      <InviteForm isFounder={isFounder} />
    </ScrollView>
  );
}
