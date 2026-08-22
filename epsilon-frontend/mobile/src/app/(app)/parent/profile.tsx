import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ChildIcon, PencilIcon, PinIcon, PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as parentApi from "@/services/parentProfile";
import { useAuthStore } from "@/store/authStore";

const MAX_CHILDREN = 5;

function AddChildForm({ onCancel, onSubmit, loading }: {
  onCancel: () => void;
  onSubmit: (data: parentApi.ChildInput) => void;
  loading: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [targetSubjects, setTargetSubjects] = useState("");

  return (
    <Card className="gap-3 border-xporadia-orange/30">
      <Input label="Prénom de l'enfant" value={firstName} onChangeText={setFirstName} />
      <Input label="Classe" value={classLevel} onChangeText={setClassLevel} placeholder="CM2, 5ème, ..." />
      <Input
        label="Matières cibles"
        value={targetSubjects}
        onChangeText={setTargetSubjects}
        placeholder="Maths, Français, ..."
      />
      <View className="flex-row gap-3 mt-1">
        <View className="flex-1">
          <Button label="Annuler" variant="secondary" pill onPress={onCancel} />
        </View>
        <View className="flex-1">
          <Button
            label="Ajouter"
            pill
            loading={loading}
            disabled={!firstName || !classLevel}
            onPress={() =>
              onSubmit({
                first_name: firstName,
                class_level: classLevel,
                target_subjects: targetSubjects.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </View>
      </View>
    </Card>
  );
}

function ChildCard({ child, onDelete, deleting }: {
  child: parentApi.Child;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card className="gap-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="h-10 w-10 rounded-full bg-xporadia-bg items-center justify-center">
            <ChildIcon color={Colors.navy} size={18} />
          </View>
          <View>
            <Text className="text-base font-semibold text-xporadia-text-primary">
              {child.first_name}
            </Text>
            <Text className="text-xs text-xporadia-text-secondary">{child.class_level}</Text>
          </View>
        </View>
        <Pressable onPress={onDelete} disabled={deleting} hitSlop={8} className="p-1">
          <TrashIcon size={17} />
        </Pressable>
      </View>
      {child.target_subjects.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 pl-[50px]">
          {child.target_subjects.map((subject) => (
            <Chip key={subject} label={subject} variant="navy-subtle" />
          ))}
        </View>
      )}
      <View className="pl-[50px]">
        <Button
          label="Espace élève"
          variant="secondary"
          pill
          onPress={() => router.push(`/(app)/parent/child-space/${child.id}`)}
        />
      </View>
    </Card>
  );
}

export default function ParentProfileScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["parent-profile"],
    queryFn: parentApi.fetchParentProfile,
  });

  const [editingLocation, setEditingLocation] = useState(false);
  const [location, setLocation] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const locationMutation = useMutation({
    mutationFn: () => parentApi.updateParentProfile({ location }),
    onSuccess: (data) => {
      queryClient.setQueryData(["parent-profile"], data);
      setEditingLocation(false);
    },
  });

  const addChildMutation = useMutation({
    mutationFn: (data: parentApi.ChildInput) => parentApi.addChild(data),
    onSuccess: (child) => {
      queryClient.setQueryData<parentApi.ParentProfile | undefined>(["parent-profile"], (prev) =>
        prev ? { ...prev, children: [...prev.children, child] } : prev
      );
      setAddingChild(false);
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: (id: number) => parentApi.deleteChild(id),
    onMutate: (id) => setDeletingId(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<parentApi.ParentProfile | undefined>(["parent-profile"], (prev) =>
        prev ? { ...prev, children: prev.children.filter((c) => c.id !== id) } : prev
      );
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
  });

  if (isLoading || !profile) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-xporadia-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-12">
        <View className="items-center pt-10 pb-5">
          <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
            <View className="absolute -top-6 -left-10 h-44 w-44 rounded-full bg-xporadia-navy/[0.05]" />
            <View className="absolute -top-8 -right-12 h-32 w-32 rounded-full bg-xporadia-orange/[0.07]" />
          </View>
          <AvatarPicker firstName={user?.first_name} lastName={user?.last_name} imageUri={user?.avatar} />
          <Text className="text-xl font-bold text-xporadia-navy mt-3">
            {user?.first_name} {user?.last_name}
          </Text>
          <View className="mt-2">
            <Chip label="Parent" variant="navy-subtle" />
          </View>
        </View>

        <View className="px-6 gap-5">
          <View className="bg-white rounded-3xl p-6 shadow-deep border border-xporadia-border gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <PinIcon color={Colors.navy} size={16} />
                <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                  Localisation
                </Text>
              </View>
              {!editingLocation && (
                <Pressable
                  onPress={() => {
                    setLocation(profile.location);
                    setEditingLocation(true);
                  }}
                  hitSlop={8}
                >
                  <PencilIcon size={15} color={Colors.navy} />
                </Pressable>
              )}
            </View>
            {editingLocation ? (
              <View className="gap-3">
                <Input value={location} onChangeText={setLocation} placeholder="Cocody, Abidjan" />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      label="Annuler"
                      variant="secondary"
                      pill
                      onPress={() => setEditingLocation(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Enregistrer"
                      pill
                      loading={locationMutation.isPending}
                      onPress={() => locationMutation.mutate()}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <Text className="text-sm text-xporadia-text-primary">
                {profile.location || "Non renseignée"}
              </Text>
            )}
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-xporadia-navy">
                Mes enfants ({profile.children.length}/{MAX_CHILDREN})
              </Text>
              {!addingChild && profile.children.length < MAX_CHILDREN && (
                <Pressable
                  onPress={() => setAddingChild(true)}
                  className="flex-row items-center gap-1.5 bg-xporadia-orange rounded-full px-3.5 py-2"
                >
                  <PlusIcon size={14} />
                  <Text className="text-white text-xs font-semibold">Ajouter</Text>
                </Pressable>
              )}
            </View>

            {profile.children.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                deleting={deletingId === child.id}
                onDelete={() => deleteChildMutation.mutate(child.id)}
              />
            ))}

            {addingChild && (
              <AddChildForm
                onCancel={() => setAddingChild(false)}
                onSubmit={(data) => addChildMutation.mutate(data)}
                loading={addChildMutation.isPending}
              />
            )}

            {profile.children.length === 0 && !addingChild && (
              <Text className="text-sm text-xporadia-text-secondary text-center py-4">
                Aucun enfant enregistré pour l&apos;instant.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
