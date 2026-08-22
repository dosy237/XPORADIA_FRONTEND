import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-3xl p-5 border border-xporadia-border gap-4">
      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1">
        <Text className="text-sm font-medium text-xporadia-text-primary">{label}</Text>
        {description ? (
          <Text className="text-xs text-xporadia-text-secondary mt-0.5">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.navy }}
        thumbColor={Colors.white}
        accessibilityLabel={label}
        accessibilityRole="switch"
      />
    </View>
  );
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showDeletion, setShowDeletion] = useState(false);
  const [deletionPassword, setDeletionPassword] = useState("");
  const [deletionError, setDeletionError] = useState("");

  const preferencesMutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (data) => updateUser(data),
  });

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError("");
      setOldPassword("");
      setNewPassword("");
    },
    onError: () => {
      setPasswordError("Mot de passe actuel incorrect.");
      setPasswordSuccess(false);
    },
  });

  const exportMutation = useMutation({
    mutationFn: authApi.exportMyData,
    onSuccess: async (data) => {
      const content = JSON.stringify(data, null, 2);
      try {
        await Share.share({ message: content, title: "Mes données Xporadia" });
      } catch {
        Alert.alert(
          "Vos données",
          content.length > 500 ? `${content.slice(0, 500)}...` : content
        );
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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-xporadia-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-6 gap-5 pb-12">
        <SettingsSection title="Informations personnelles">
          <View className="gap-1">
            <Text className="text-xs text-xporadia-text-secondary">Email</Text>
            <Text className="text-sm text-xporadia-text-primary">{user.email}</Text>
          </View>
          <View className="gap-1">
            <Text className="text-xs text-xporadia-text-secondary">Téléphone</Text>
            <Text className="text-sm text-xporadia-text-primary">{user.phone || "Non renseigné"}</Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Sécurité">
          <Input
            label="Mot de passe actuel"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            accessibilityLabel="Mot de passe actuel"
          />
          <Input
            label="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            accessibilityLabel="Nouveau mot de passe"
          />
          {passwordError ? (
            <Text className="text-xs text-xporadia-red">{passwordError}</Text>
          ) : null}
          {passwordSuccess ? (
            <Text className="text-xs text-xporadia-green">Mot de passe mis à jour.</Text>
          ) : null}
          <Button
            label="Changer le mot de passe"
            variant="navy"
            pill
            loading={passwordMutation.isPending}
            disabled={!oldPassword || newPassword.length < 8}
            onPress={() => passwordMutation.mutate()}
          />

          <View className="h-px bg-xporadia-border" />

          <ToggleRow
            label="Authentification à deux facteurs"
            description="Protection supplémentaire à la connexion (bientôt appliquée)"
            value={user.two_fa_enabled}
            onValueChange={(v) => preferencesMutation.mutate({ two_fa_enabled: v })}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <ToggleRow
            label="Email"
            value={user.notify_email}
            onValueChange={(v) => preferencesMutation.mutate({ notify_email: v })}
          />
          <ToggleRow
            label="SMS"
            value={user.notify_sms}
            onValueChange={(v) => preferencesMutation.mutate({ notify_sms: v })}
          />
          <ToggleRow
            label="Push"
            value={user.notify_push}
            onValueChange={(v) => preferencesMutation.mutate({ notify_push: v })}
          />
        </SettingsSection>

        <SettingsSection title="Visibilité">
          <ToggleRow
            label="Profil public visible"
            description="Masquez votre profil des recherches sans supprimer votre compte"
            value={user.profile_visible}
            onValueChange={(v) => preferencesMutation.mutate({ profile_visible: v })}
          />
        </SettingsSection>

        <SettingsSection title="Confidentialité">
          <Text className="text-xs text-xporadia-text-secondary leading-5">
            Conformément au RGPD, vous pouvez à tout moment télécharger l&apos;ensemble de vos
            données personnelles ou demander la suppression de votre compte.
          </Text>
          <Button
            label="Télécharger mes données"
            variant="secondary"
            pill
            loading={exportMutation.isPending}
            onPress={() => exportMutation.mutate()}
          />

          {!showDeletion ? (
            <Pressable
              onPress={() => setShowDeletion(true)}
              accessibilityRole="button"
              accessibilityLabel="Demander la suppression de mon compte"
              hitSlop={8}
              className="py-2"
            >
              <Text className="text-xs text-xporadia-red font-semibold text-center">
                Demander la suppression de mon compte
              </Text>
            </Pressable>
          ) : (
            <View className="gap-3 border-t border-xporadia-border pt-4">
              <Text className="text-xs text-xporadia-text-primary leading-5">
                Cette action anonymise vos données et désactive définitivement votre compte.
                Confirmez avec votre mot de passe.
              </Text>
              <Input
                label="Mot de passe"
                value={deletionPassword}
                onChangeText={setDeletionPassword}
                secureTextEntry
                accessibilityLabel="Mot de passe pour confirmer la suppression"
              />
              {deletionError ? (
                <Text className="text-xs text-xporadia-red">{deletionError}</Text>
              ) : null}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label="Annuler"
                    variant="secondary"
                    pill
                    onPress={() => {
                      setShowDeletion(false);
                      setDeletionPassword("");
                      setDeletionError("");
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Confirmer la suppression"
                    variant="danger"
                    pill
                    loading={deletionMutation.isPending}
                    disabled={!deletionPassword}
                    onPress={() => deletionMutation.mutate()}
                  />
                </View>
              </View>
            </View>
          )}
        </SettingsSection>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
