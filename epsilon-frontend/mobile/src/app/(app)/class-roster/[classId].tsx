import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as academicsApi from "@/services/academics";
import type { ChildBasic, Enrollment, EnrollmentStatus, SchoolClass } from "@/services/academics";
import { useAuthStore } from "@/store/authStore";

const STATUS_LABELS: Record<Exclude<EnrollmentStatus, "active">, string> = {
  promoted: "Passe en classe supérieure",
  repeating: "Redouble",
  withdrawn: "A quitté l'établissement",
};

function TargetClassPicker({
  classes,
  onPick,
  onCancel,
}: {
  classes: SchoolClass[];
  onPick: (targetClassId: number) => void;
  onCancel: () => void;
}) {
  return (
    <View className="gap-2 mt-2">
      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
        Choisir la classe cible
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {classes.map((c) => (
          <Pressable key={c.id} onPress={() => onPick(c.id)}>
            <Chip label={`${c.name} (${c.school_year})`} variant="navy-subtle" />
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onCancel}>
        <Text className="text-xs text-xporadia-text-secondary">Annuler</Text>
      </Pressable>
    </View>
  );
}

function RosterRow({
  enrollment,
  isDirector,
  otherClasses,
  onTransition,
  onWithdraw,
}: {
  enrollment: Enrollment;
  isDirector: boolean;
  otherClasses: SchoolClass[];
  onTransition: (enrollmentId: number, status: "promoted" | "repeating", targetClassId: number) => void;
  onWithdraw: (enrollmentId: number) => void;
}) {
  const [picking, setPicking] = useState<"promoted" | "repeating" | null>(null);

  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <Text className="text-base font-semibold text-xporadia-text-primary">
        {enrollment.child.first_name}
      </Text>
      <Text className="text-xs text-xporadia-text-secondary">{enrollment.child.class_level}</Text>

      {isDirector && (
        <>
          {picking ? (
            <TargetClassPicker
              classes={otherClasses}
              onPick={(targetClassId) => {
                onTransition(enrollment.id, picking, targetClassId);
                setPicking(null);
              }}
              onCancel={() => setPicking(null)}
            />
          ) : (
            <View className="flex-row flex-wrap gap-2 mt-1">
              <Button label="Passe" pill onPress={() => setPicking("promoted")} />
              <Button label="Redouble" variant="secondary" pill onPress={() => setPicking("repeating")} />
              <Button
                label="A quitté"
                variant="secondary"
                pill
                onPress={() =>
                  Alert.alert(
                    "Confirmer le départ",
                    `${enrollment.child.first_name} sera retiré(e) de cette classe.`,
                    [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Confirmer",
                        style: "destructive",
                        onPress: () => onWithdraw(enrollment.id),
                      },
                    ]
                  )
                }
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}

export default function ClassRosterScreen() {
  const { classId, className, schoolYear } = useLocalSearchParams<{
    classId: string;
    className?: string;
    schoolYear?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const isDirector = user?.all_roles?.includes("director") ?? false;
  const queryClient = useQueryClient();

  const [parentEmail, setParentEmail] = useState("");
  const [foundChildren, setFoundChildren] = useState<ChildBasic[] | null>(null);

  const rosterQueryKey = ["class-roster", classId];
  const { data: roster, isLoading } = useQuery({
    queryKey: rosterQueryKey,
    queryFn: () => academicsApi.fetchClassRoster(Number(classId)),
    enabled: !!classId,
  });

  const { data: allClasses } = useQuery({
    queryKey: ["all-my-classes"],
    queryFn: academicsApi.fetchAllMyClasses,
    enabled: isDirector,
  });
  const otherClasses = (allClasses ?? []).filter((c) => c.id !== Number(classId));

  const lookupMutation = useMutation({
    mutationFn: () => academicsApi.lookupChildrenByParentEmail(parentEmail),
    onSuccess: (children) => setFoundChildren(children),
    onError: () => Alert.alert("Erreur", "Impossible de rechercher cet email."),
  });

  const enrollMutation = useMutation({
    mutationFn: (childId: number) => academicsApi.enrollChild(Number(classId), childId),
    onSuccess: (enrollment) => {
      queryClient.setQueryData<Enrollment[] | undefined>(rosterQueryKey, (prev) =>
        prev ? [enrollment, ...prev] : [enrollment]
      );
      setFoundChildren(null);
      setParentEmail("");
    },
    onError: () => Alert.alert("Erreur", "Impossible d'inscrire cet élève."),
  });

  const removeFromRoster = (enrollmentId: number) => {
    queryClient.setQueryData<Enrollment[] | undefined>(rosterQueryKey, (prev) =>
      prev ? prev.filter((e) => e.id !== enrollmentId) : prev
    );
  };

  const transitionMutation = useMutation({
    mutationFn: ({
      enrollmentId,
      status,
      targetClassId,
    }: {
      enrollmentId: number;
      status: "promoted" | "repeating";
      targetClassId: number;
    }) => academicsApi.transitionEnrollment(enrollmentId, { status, target_class_id: targetClassId }),
    onSuccess: (_data, variables) => removeFromRoster(variables.enrollmentId),
    onError: () => Alert.alert("Erreur", "Impossible de traiter cette transition."),
  });

  const withdrawMutation = useMutation({
    mutationFn: (enrollmentId: number) =>
      academicsApi.transitionEnrollment(enrollmentId, { status: "withdrawn" }),
    onSuccess: (_data, enrollmentId) => removeFromRoster(enrollmentId),
    onError: () => Alert.alert("Erreur", "Impossible de traiter ce départ."),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Effectifs de {className ?? "cette classe"}
        {schoolYear ? ` — ${schoolYear}` : ""}.
        {isDirector
          ? " Vous pouvez inscrire un élève, ou traiter le passage, le redoublement et les départs."
          : " Vous pouvez inscrire un nouvel élève en cours d'année."}
      </Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (roster ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucun élève inscrit pour l&apos;instant.
        </Text>
      ) : (
        <View className="gap-3">
          {(roster ?? []).map((enrollment) => (
            <RosterRow
              key={enrollment.id}
              enrollment={enrollment}
              isDirector={isDirector}
              otherClasses={otherClasses}
              onTransition={(enrollmentId, status, targetClassId) =>
                transitionMutation.mutate({ enrollmentId, status, targetClassId })
              }
              onWithdraw={(enrollmentId) => withdrawMutation.mutate(enrollmentId)}
            />
          ))}
        </View>
      )}

      <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
          Inscrire un élève
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              placeholder="Email du parent"
              value={parentEmail}
              onChangeText={setParentEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <Button
            label="Rechercher"
            pill
            disabled={!parentEmail || lookupMutation.isPending}
            onPress={() => lookupMutation.mutate()}
          />
        </View>

        {foundChildren && (
          <View className="gap-2">
            {foundChildren.length === 0 ? (
              <Text className="text-xs text-xporadia-text-secondary">Aucun enfant trouvé pour cet email.</Text>
            ) : (
              foundChildren.map((child) => (
                <Pressable
                  key={child.id}
                  onPress={() => enrollMutation.mutate(child.id)}
                  className="flex-row items-center justify-between bg-xporadia-bg rounded-xl px-3 py-2"
                >
                  <Text className="text-sm text-xporadia-text-primary">
                    {child.first_name} ({child.class_level})
                  </Text>
                  <Text className="text-xs font-semibold text-xporadia-orange">Inscrire</Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
