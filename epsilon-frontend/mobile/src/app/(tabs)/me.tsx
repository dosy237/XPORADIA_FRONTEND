import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, Text, View } from "react-native";

import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import {
  BriefcaseIcon,
  BuildingIcon,
  ChildIcon,
  DownloadIcon,
  GearIcon,
  LayersIcon,
  MedalIcon,
  TrashIcon,
} from "@/components/ui/Icon";
import { LEVEL_COLORS, LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import * as authApi from "@/services/auth";
import * as certificationApi from "@/services/certification";
import * as companyProfileApi from "@/services/companyProfile";
import * as directorProfileApi from "@/services/directorProfile";
import * as parentProfileApi from "@/services/parentProfile";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/user";

const ROLE_LABELS: Record<UserRole, string> = {
  teacher: "Enseignant",
  director: "Directeur d'établissement",
  parent: "Parent d'élève",
  company: "Entreprise",
  trainer: "Formateur partenaire",
  admin: "Administrateur Xporadia",
  student: "Élève",
};

const ROLE_DASHBOARD_PATH: Record<string, string> = {
  teacher: "/(app)/teacher/dashboard",
  director: "/(app)/director/dashboard",
  parent: "/(app)/parent/dashboard",
  company: "/(app)/company/dashboard",
  student: "/(app)/student/dashboard",
  admin: "/(app)/admin/dashboard",
};

function RoleStat() {
  const currentRole = useAuthStore((s) => s.currentRole);

  const { data: certStatus } = useQuery({
    queryKey: ["my-certification-status"],
    queryFn: certificationApi.fetchMyCertificationStatus,
    enabled: currentRole === "teacher",
  });
  const { data: directorProfile } = useQuery({
    queryKey: ["director-profile"],
    queryFn: directorProfileApi.fetchDirectorProfile,
    enabled: currentRole === "director",
  });
  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile"],
    queryFn: companyProfileApi.fetchCompanyProfile,
    enabled: currentRole === "company",
  });
  const { data: parentProfile } = useQuery({
    queryKey: ["parent-profile"],
    queryFn: parentProfileApi.fetchParentProfile,
    enabled: currentRole === "parent",
  });
  const { data: myClass } = useQuery({
    queryKey: ["my-class"],
    queryFn: academicsApi.fetchMyClass,
    enabled: currentRole === "student",
  });

  if (currentRole === "teacher") {
    const level = certStatus?.current_level;
    return (
      <View className="flex-row items-center gap-2">
        <MedalIcon size={16} color={level ? LEVEL_COLORS[level] : Colors.textSecondary} />
        <Text className="text-sm font-semibold text-xporadia-navy">
          {level ? `Niveau ${LEVEL_LABELS[level]}` : "Pas encore certifié"}
        </Text>
      </View>
    );
  }

  if (currentRole === "director" && directorProfile) {
    return (
      <View className="flex-row items-center gap-2">
        <BuildingIcon size={16} color={Colors.textSecondary} />
        <Text className="text-sm font-semibold text-xporadia-navy">{directorProfile.school_name}</Text>
        {directorProfile.is_partner && <Chip label="Partenaire" variant="orange" />}
      </View>
    );
  }

  if (currentRole === "company" && companyProfile) {
    return (
      <View className="flex-row items-center gap-2">
        <BriefcaseIcon size={16} color={Colors.textSecondary} />
        <Text className="text-sm font-semibold text-xporadia-navy">{companyProfile.company_name}</Text>
      </View>
    );
  }

  if (currentRole === "parent" && parentProfile) {
    return (
      <View className="flex-row items-center gap-2">
        <ChildIcon size={16} color={Colors.textSecondary} />
        <Text className="text-sm font-semibold text-xporadia-navy">
          {parentProfile.children.length} enfant{parentProfile.children.length !== 1 ? "s" : ""} suivi
          {parentProfile.children.length !== 1 ? "s" : ""}
        </Text>
      </View>
    );
  }

  if (currentRole === "student") {
    return (
      <View className="flex-row items-center gap-2">
        <LayersIcon size={16} color={Colors.textSecondary} />
        <Text className="text-sm font-semibold text-xporadia-navy">
          {myClass?.school_class_name ?? "Aucun établissement rattaché"}
        </Text>
      </View>
    );
  }

  return null;
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={label} className="flex-row items-center gap-3">
      <View
        className={`h-10 w-10 rounded-full items-center justify-center ${
          destructive ? "bg-xporadia-red/10" : "bg-xporadia-bg"
        }`}
      >
        {icon}
      </View>
      <Text className={`text-sm font-semibold flex-1 ${destructive ? "text-xporadia-red" : "text-xporadia-text-primary"}`}>
        {label}
      </Text>
    </Card>
  );
}

function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const currentRole = useAuthStore((s) => s.currentRole);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deletionPassword, setDeletionPassword] = useState("");
  const [deletionError, setDeletionError] = useState("");

  const exportMutation = useMutation({
    mutationFn: authApi.exportMyData,
    onSuccess: async (data) => {
      const content = JSON.stringify(data, null, 2);
      try {
        await Share.share({ message: content, title: "Mes données Xporadia" });
      } catch {
        Alert.alert("Vos données", content.length > 500 ? `${content.slice(0, 500)}...` : content);
      }
    },
  });

  const deletionMutation = useMutation({
    mutationFn: () => authApi.requestAccountDeletion(deletionPassword),
    onSuccess: () => {
      queryClient.clear();
      logout();
      router.replace("/(auth)/login");
    },
    onError: () => setDeletionError("Mot de passe incorrect."),
  });

  if (!user) return null;

  const dashboardPath = ROLE_DASHBOARD_PATH[currentRole ?? user.primary_role];

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-6 gap-5 pb-12">
        <View className="items-center gap-3 pt-2">
          <AvatarPicker firstName={user.first_name} lastName={user.last_name} imageUri={user.avatar} size={88} />
          <View className="items-center gap-1">
            <Text className="text-xl font-bold text-xporadia-navy">
              {user.first_name} {user.last_name}
            </Text>
            <Text className="text-sm text-xporadia-text-secondary">
              {ROLE_LABELS[currentRole ?? user.primary_role]}
            </Text>
          </View>
          <RoleStat />
        </View>

        {dashboardPath ? (
          <Button label="Accéder à mon tableau de bord" pill onPress={() => router.push(dashboardPath as never)} />
        ) : null}

        <View className="gap-2">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase px-1">Mon compte</Text>
          <ActionRow
            icon={<GearIcon size={18} color={Colors.navy} />}
            label="Informations personnelles et paramètres"
            onPress={() => router.push("/(app)/settings")}
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase px-1">Confidentialité</Text>
          <ActionRow
            icon={<DownloadIcon size={18} color={Colors.navy} />}
            label="Télécharger mes données"
            onPress={() => exportMutation.mutate()}
          />
          {!confirmingDeletion ? (
            <ActionRow
              icon={<TrashIcon size={18} color={Colors.red} />}
              label="Supprimer mon compte"
              onPress={() => setConfirmingDeletion(true)}
              destructive
            />
          ) : (
            <Card className="gap-3">
              <Text className="text-xs text-xporadia-text-primary leading-5">
                Cette action anonymise vos données et désactive définitivement votre compte. Confirmez avec votre
                mot de passe.
              </Text>
              <Input
                label="Mot de passe"
                value={deletionPassword}
                onChangeText={setDeletionPassword}
                secureTextEntry
                accessibilityLabel="Mot de passe pour confirmer la suppression"
              />
              {deletionError ? <Text className="text-xs text-xporadia-red">{deletionError}</Text> : null}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label="Annuler"
                    variant="secondary"
                    pill
                    onPress={() => {
                      setConfirmingDeletion(false);
                      setDeletionPassword("");
                      setDeletionError("");
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Confirmer"
                    variant="danger"
                    pill
                    loading={deletionMutation.isPending}
                    disabled={!deletionPassword}
                    onPress={() => deletionMutation.mutate()}
                  />
                </View>
              </View>
            </Card>
          )}
        </View>

        <Text
          className="text-sm text-xporadia-text-secondary text-center font-medium pt-2"
          onPress={logout}
          suppressHighlighting
        >
          Se déconnecter
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function MeScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Un visiteur non connecté qui touche l'onglet Profil est renvoyé
  // directement vers l'authentification plutôt que de voir un écran
  // "connectez-vous" planté dans la barre d'onglets.
  useEffect(() => {
    if (!isAuthenticated) router.replace("/(auth)/welcome");
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return <ProfileScreen />;
}
