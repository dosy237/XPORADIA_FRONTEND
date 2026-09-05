import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import * as academicsApi from "@/services/academics";
import { useAuthStore } from "@/store/authStore";

export default function AcceptInvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const { data: invitation, isLoading, isError } = useQuery({
    queryKey: ["invitation-preview", token],
    queryFn: () => academicsApi.fetchInvitationPreview(String(token)),
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => academicsApi.acceptInvitation(String(token)),
    onSuccess: (subject) => {
      router.replace({
        pathname: "/(app)/teacher/subject/[subjectId]",
        params: { subjectId: String(subject.id), editable: "1" },
      });
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (isError || !invitation) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-3">
        <Text className="text-base font-semibold text-xporadia-text-primary text-center">
          Invitation introuvable ou déjà utilisée.
        </Text>
        <Button label="Retour à l'accueil" pill onPress={() => router.replace("/(tabs)/actualites")} />
      </View>
    );
  }

  const emailMatches = isAuthenticated && user?.email.toLowerCase() === invitation.email.toLowerCase();
  const isTeacher = user?.all_roles?.includes("teacher");

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="pb-10 flex-grow">
      <AuthHeader
        title="Invitation à enseigner"
        subtitle={`${invitation.invited_by_name} vous invite chez ${invitation.school_name}`}
      />

      <View className="px-6 pt-4">
        <View className="bg-white rounded-2xl p-6 gap-4 shadow-card border border-xporadia-border">
          <View className="gap-1">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Matière</Text>
            <Text className="text-lg font-bold text-xporadia-navy">{invitation.subject_name}</Text>
          </View>
          <View className="gap-1">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Classe</Text>
            <Text className="text-sm text-xporadia-text-primary">{invitation.school_class_name}</Text>
          </View>
          <View className="gap-1">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
              Invitation envoyée à
            </Text>
            <Text className="text-sm text-xporadia-text-primary">{invitation.email}</Text>
          </View>

          {isAuthenticated ? (
            emailMatches && isTeacher ? (
              <Button
                label="Rejoindre cette matière"
                pill
                loading={acceptMutation.isPending}
                onPress={() => acceptMutation.mutate()}
              />
            ) : (
              <View className="gap-3">
                <Text className="text-sm text-xporadia-red">
                  Cette invitation est destinée à {invitation.email}. Connectez-vous avec ce compte
                  enseignant pour l&apos;accepter.
                </Text>
                <Button label="Se déconnecter" variant="secondary" pill onPress={logout} />
              </View>
            )
          ) : (
            <View className="gap-3">
              <Button
                label="J'ai déjà un compte"
                pill
                onPress={() =>
                  router.push({
                    pathname: "/(auth)/login",
                    params: { inviteToken: String(token) },
                  })
                }
              />
              <Button
                label="Créer un compte enseignant"
                variant="secondary"
                pill
                onPress={() =>
                  router.push({
                    pathname: "/(auth)/register",
                    params: { inviteToken: String(token), prefillEmail: invitation.email },
                  })
                }
              />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
