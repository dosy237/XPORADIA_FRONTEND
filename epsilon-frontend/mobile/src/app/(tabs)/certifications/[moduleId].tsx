import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ClockIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as certificationApi from "@/services/certification";
import type { MobileOperator, TrainingSession } from "@/services/certification";
import { useAuthStore } from "@/store/authStore";

const NEXT_SESSIONS_COUNT = 3;
const OPERATORS: { value: MobileOperator; label: string }[] = [
  { value: "orange", label: "Orange Money" },
  { value: "wave", label: "Wave" },
  { value: "mtn", label: "MTN Money" },
];

export default function PublicModuleDetailScreen() {
  const { moduleId, from } = useLocalSearchParams<{ moduleId: string; from?: string }>();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isTeacher = useAuthStore((s) => s.currentRole === "teacher");
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [operator, setOperator] = useState<MobileOperator>("orange");
  const [phone, setPhone] = useState("");

  const { data: module, isLoading } = useQuery({
    queryKey: ["training-module", moduleId],
    queryFn: () => certificationApi.fetchTrainingModule(moduleId),
  });

  const { data: sessions } = useQuery({
    queryKey: ["training-sessions", moduleId],
    queryFn: () => certificationApi.fetchTrainingSessions({ module: moduleId }),
    enabled: !!moduleId,
  });

  const enrollMutation = useMutation({
    mutationFn: () => {
      if (!selectedSession) throw new Error("Aucune session sélectionnée.");
      return certificationApi.enrollInSession(selectedSession.id, { operator, phone_number: phone.trim() });
    },
    onSuccess: () => {
      setSelectedSession(null);
      setPhone("");
      queryClient.invalidateQueries({ queryKey: ["training-sessions", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["my-certification-status"] });
    },
  });

  const handleSessionPress = (session: TrainingSession) => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    if (!isTeacher) return; // le bandeau ci-dessous explique déjà pourquoi
    setSelectedSession(session);
  };

  if (isLoading || !module) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  const nextSessions = (sessions ?? []).slice(0, NEXT_SESSIONS_COUNT);

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      {from ? (
        <View className="bg-xporadia-navy/[0.06] rounded-2xl p-3">
          <Text className="text-xs text-xporadia-navy">
            Vous avez découvert ce module via le profil de {from}.
          </Text>
        </View>
      ) : null}

      {module.cover_image ? (
        <Image source={{ uri: module.cover_image }} style={{ width: "100%", height: 180, borderRadius: 16 }} contentFit="cover" />
      ) : null}

      <View className="bg-white rounded-3xl p-6 shadow-soft gap-4">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="text-xl font-bold text-xporadia-navy flex-1">{module.title}</Text>
          <Chip label={LEVEL_LABELS[module.target_level]} variant="navy-subtle" />
        </View>
        <Text className="text-xs text-xporadia-text-secondary">
          {CATEGORY_LABELS[module.category] ?? module.category}
        </Text>
        <Text className="text-sm text-xporadia-text-primary leading-5">{module.description}</Text>

        {module.objectives.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
              Objectifs pédagogiques
            </Text>
            {module.objectives.map((objective) => (
              <Text key={objective} className="text-sm text-xporadia-text-primary">
                • {objective}
              </Text>
            ))}
          </View>
        )}

        <View className="flex-row items-center gap-4 pt-1">
          <View className="flex-row items-center gap-1.5">
            <ClockIcon size={14} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">{module.duration_hours}h</Text>
          </View>
          <Text className="text-sm font-semibold text-xporadia-navy">
            {module.price.toLocaleString("fr-FR")} FCFA
          </Text>
        </View>
      </View>

      {!isAuthenticated ? (
        <Card className="items-center gap-3 py-6">
          <Text className="text-sm text-xporadia-text-secondary text-center">
            Connectez-vous pour vous inscrire à une session de ce module.
          </Text>
          <Button label="Se connecter" pill onPress={() => router.push("/(auth)/login")} />
        </Card>
      ) : !isTeacher ? (
        <Card>
          <Text className="text-xs text-xporadia-text-secondary text-center leading-5">
            La certification Xporadia est réservée aux enseignants. Ce module reste consultable,
            mais l'inscription n'est pas ouverte à votre profil.
          </Text>
        </Card>
      ) : null}

      {nextSessions.length > 0 && (
        <View className="gap-3">
          <Text className="text-base font-bold text-xporadia-navy">Prochaines sessions</Text>
          {nextSessions.map((session) => (
            <Card
              key={session.id}
              onPress={() => handleSessionPress(session)}
              className={isAuthenticated && isTeacher ? "gap-1" : "gap-1 opacity-60"}
            >
              <Text className="text-sm font-semibold text-xporadia-text-primary">
                {session.city} · {new Date(session.date).toLocaleDateString("fr-FR")}
              </Text>
              <Text className="text-xs text-xporadia-text-secondary">
                {session.location} · {session.places_left} places restantes
              </Text>
            </Card>
          ))}
        </View>
      )}

      {selectedSession ? (
        <Card className="gap-3">
          <Text className="text-sm font-bold text-xporadia-navy">
            Paiement · {selectedSession.city}, {new Date(selectedSession.date).toLocaleDateString("fr-FR")}
          </Text>
          <View className="flex-row gap-2">
            {OPERATORS.map((op) => (
              <Chip
                key={op.value}
                label={op.label}
                variant={operator === op.value ? "navy" : "neutral"}
                onPress={() => setOperator(op.value)}
              />
            ))}
          </View>
          <Input
            label="Numéro Mobile Money"
            value={phone}
            onChangeText={setPhone}
            placeholder="Ex. 07 00 00 00 00"
            keyboardType="phone-pad"
          />
          {enrollMutation.error ? (
            <Text className="text-xs text-xporadia-red">L'inscription a échoué. Vérifiez le numéro saisi.</Text>
          ) : null}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setSelectedSession(null)} />
            </View>
            <View className="flex-1">
              <Button
                label="Payer et s'inscrire"
                pill
                onPress={() => enrollMutation.mutate()}
                loading={enrollMutation.isPending}
                disabled={phone.trim().length < 8}
              />
            </View>
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}
