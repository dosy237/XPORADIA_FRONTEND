import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import * as adminUsersApi from "@/services/adminUsers";
import * as certificationApi from "@/services/certification";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import type { CertificationLevel } from "@/services/certification";
import { useAuthStore } from "@/store/authStore";

const ROLE_LABELS: Record<string, string> = {
  student: "Élève", teacher: "Enseignant", director: "Directeur d'établissement", company: "Entreprise",
};

const DETAIL_FIELD_LABELS: Record<string, string> = {
  school_name: "Établissement",
  is_partner: "Partenaire",
  address: "Adresse",
  phone: "Téléphone",
  contact_email: "Email de contact",
  establishment_code: "Code établissement",
  is_public: "Profil public",
  departments_count: "Départements",
  tracks_count: "Filières",
  classes_count: "Classes",
  active_students_count: "Élèves inscrits",
  teachers_count: "Enseignants titulaires",
  company_name: "Entreprise",
  declared_level: "Niveau déclaré",
  has_parent: "Parent rattaché",
  school_class: "Classe",
  establishment: "Établissement",
  subjects: "Matières",
  is_documents_validated: "Documents validés",
  profile_visible: "Profil visible",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-xporadia-border">
      <Text className="text-xs text-xporadia-text-secondary">{label}</Text>
      <Text className="text-xs font-semibold text-xporadia-text-primary">{value}</Text>
    </View>
  );
}

function CertificationRow({
  certification,
}: {
  certification: NonNullable<adminUsersApi.AdminUserDetail["certifications"]>[number];
}) {
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: () => certificationApi.revokeCertification(certification.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] }),
  });

  const reinstateMutation = useMutation({
    mutationFn: () => certificationApi.reinstateCertification(certification.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] }),
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">
          {certification.module_title}
        </Text>
        <Chip
          label={LEVEL_LABELS[certification.level as CertificationLevel] ?? certification.level}
          variant={certification.is_valid ? "orange" : "neutral"}
        />
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        Score {certification.score_total}/100 · {certification.is_valid ? "Valide" : "Révoquée"}
      </Text>
      <Button
        label={certification.is_valid ? "Révoquer" : "Rétablir"}
        variant="secondary"
        pill
        loading={revokeMutation.isPending || reinstateMutation.isPending}
        onPress={() =>
          Alert.alert(
            certification.is_valid ? "Révoquer cette certification ?" : "Rétablir cette certification ?",
            certification.module_title,
            [
              { text: "Annuler", style: "cancel" },
              {
                text: "Confirmer",
                style: certification.is_valid ? "destructive" : "default",
                onPress: () =>
                  certification.is_valid ? revokeMutation.mutate() : reinstateMutation.mutate(),
              },
            ]
          )
        }
      />
    </View>
  );
}

export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const id = Number(userId);
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const canPromoteAdmin = me?.admin_scope === "full";

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: () => adminUsersApi.fetchAdminUserDetail(id),
    enabled: !!id,
  });

  const suspendMutation = useMutation({
    mutationFn: () => adminUsersApi.suspendUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => adminUsersApi.reactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: () => adminUsersApi.promoteToAdmin(id, "full"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
      Alert.alert("Compte promu", "Ce compte a maintenant un accès administrateur complet.");
    },
    onError: () => Alert.alert("Erreur", "Impossible de promouvoir ce compte."),
  });

  if (isLoading || !user) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  const detail = user.role_detail;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="items-center gap-3">
        <Avatar firstName={user.first_name} lastName={user.last_name} imageUri={user.avatar} size={72} />
        <View className="items-center gap-1">
          <Text className="text-xl font-bold text-xporadia-navy">
            {user.first_name} {user.last_name}
          </Text>
          <Text className="text-xs text-xporadia-text-secondary">{user.email}</Text>
        </View>
        <View className="flex-row gap-2">
          <Chip label={ROLE_LABELS[user.primary_role]} variant="navy-subtle" />
          <Chip label={user.is_active ? "Actif" : "Suspendu"} variant={user.is_active ? "navy-subtle" : "orange"} />
        </View>
      </View>

      {Object.keys(detail).length > 0 && (
        <View className="bg-white rounded-2xl p-4 shadow-soft">
          {Object.entries(detail).map(([key, value]) => (
            <DetailRow
              key={key}
              label={DETAIL_FIELD_LABELS[key] ?? key}
              value={
                value === null || value === ""
                  ? "Non renseigné"
                  : Array.isArray(value)
                    ? value.length ? value.join(", ") : "Non renseigné"
                    : typeof value === "boolean"
                      ? value ? "Oui" : "Non"
                      : String(value)
              }
            />
          ))}
        </View>
      )}

      {user.certifications && user.certifications.length > 0 && (
        <View className="gap-3">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
            Certifications
          </Text>
          {user.certifications.map((cert) => (
            <CertificationRow key={cert.id} certification={cert} />
          ))}
        </View>
      )}

      {user.primary_role === "director" && (
        <Button
          label="Modifier l'établissement"
          variant="secondary"
          pill
          onPress={() => router.push(`/(app)/admin/edit-establishment/${id}`)}
        />
      )}

      {canPromoteAdmin && (
        <Button
          label="Promouvoir administrateur"
          variant="secondary"
          pill
          loading={promoteMutation.isPending}
          onPress={() =>
            Alert.alert(
              "Donner l'accès administrateur ?",
              `${user.first_name} ${user.last_name} garde son rôle actuel et obtient en plus un accès administrateur complet.`,
              [
                { text: "Annuler", style: "cancel" },
                { text: "Confirmer", onPress: () => promoteMutation.mutate() },
              ]
            )
          }
        />
      )}

      <Button
        label={user.is_active ? "Suspendre ce compte" : "Réactiver ce compte"}
        variant={user.is_active ? "secondary" : "primary"}
        pill
        loading={suspendMutation.isPending || reactivateMutation.isPending}
        onPress={() =>
          Alert.alert(
            user.is_active ? "Suspendre ce compte ?" : "Réactiver ce compte ?",
            user.is_active
              ? "Le compte perd immédiatement l'accès. Réversible à tout moment."
              : "L'accès est immédiatement rétabli.",
            [
              { text: "Annuler", style: "cancel" },
              {
                text: "Confirmer",
                style: user.is_active ? "destructive" : "default",
                onPress: () => (user.is_active ? suspendMutation.mutate() : reactivateMutation.mutate()),
              },
            ]
          )
        }
      />
    </ScrollView>
  );
}
