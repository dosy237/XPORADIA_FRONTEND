import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { Chip } from "@/components/ui/Chip";
import { BuildingIcon, LayersIcon, PencilIcon, UsersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StatBox } from "@/components/ui/StatBox";
import { Colors } from "@/constants/theme";
import { openInMaps } from "@/lib/openInMaps";
import * as directorApi from "@/services/directorProfile";
import { useAuthStore } from "@/store/authStore";

export default function DirectorProfileScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["director-profile"],
    queryFn: directorApi.fetchDirectorProfile,
  });

  const [editing, setEditing] = useState(false);

  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [levelsTaught, setLevelsTaught] = useState("");
  const [studentCount, setStudentCount] = useState("");

  useEffect(() => {
    if (!profile) return;
    setSchoolName(profile.school_name);
    setAddress(profile.address);
    setLevelsTaught(profile.levels_taught.join(", "));
    setStudentCount(profile.student_count != null ? String(profile.student_count) : "");
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      directorApi.updateDirectorProfile({
        school_name: schoolName,
        address,
        levels_taught: levelsTaught.split(",").map((s) => s.trim()).filter(Boolean),
        student_count: studentCount ? Number(studentCount) : null,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["director-profile"], data);
      setEditing(false);
    },
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
          <View>
            <AvatarPicker firstName={user?.first_name} lastName={user?.last_name} imageUri={user?.avatar} />
            {profile.is_partner && (
              <View
                className="absolute bottom-1 left-1 h-4 w-4 rounded-full bg-xporadia-orange border-2 border-white"
              />
            )}
          </View>
          <Text className="text-xl font-bold text-xporadia-navy mt-3">
            {user?.first_name} {user?.last_name}
          </Text>
          <View className="mt-2 flex-row gap-2">
            <Chip label="Directeur d'établissement" variant="navy-subtle" />
            {profile.is_partner && <Chip label="École Partenaire" variant="orange" />}
          </View>
        </View>

        <View className="px-6">
          {!editing ? (
            <View className="gap-5">
              <View className="bg-white rounded-3xl p-6 shadow-deep border border-xporadia-border gap-5">
                <View className="flex-row gap-3">
                  <StatBox
                    icon={<BuildingIcon color={Colors.navy} size={18} />}
                    label="Établissement"
                    value={profile.school_name || "Non renseigné"}
                  />
                  <StatBox
                    icon={<UsersIcon color={Colors.navy} size={18} />}
                    label="Effectif"
                    value={profile.student_count != null ? `${profile.student_count} élèves` : "Non renseigné"}
                  />
                  <StatBox
                    icon={<LayersIcon color={Colors.navy} size={18} />}
                    label="Niveaux"
                    value={profile.levels_taught.length ? String(profile.levels_taught.length) : "Non renseigné"}
                  />
                </View>

                <Pressable
                  onPress={() => openInMaps(profile.address)}
                  disabled={!profile.address}
                  className="gap-1"
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir l'adresse dans Maps"
                >
                  <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                    Adresse
                  </Text>
                  <Text className="text-sm text-xporadia-text-primary leading-5">{profile.address}</Text>
                </Pressable>

                {profile.levels_taught.length > 0 && (
                  <View className="gap-2">
                    <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                      Niveaux enseignés
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {profile.levels_taught.map((level) => (
                        <Chip key={level} label={level} variant="navy-subtle" />
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => setEditing(true)}
                className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-4"
                style={{
                  shadowColor: "#FB5406",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.28,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <PencilIcon size={16} color="#FFFFFF" />
                <Text className="text-white font-semibold">Modifier ma fiche établissement</Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-white rounded-3xl p-5 gap-4 shadow-deep border border-xporadia-border">
              <Input label="Nom de l'établissement" value={schoolName} onChangeText={setSchoolName} />
              <Input label="Adresse" value={address} onChangeText={setAddress} placeholder="Cocody, Abidjan" />
              <Input
                label="Niveaux enseignés"
                value={levelsTaught}
                onChangeText={setLevelsTaught}
                placeholder="Primaire, Collège, ..."
              />
              <Input
                label="Effectif (nombre d'élèves)"
                value={studentCount}
                onChangeText={setStudentCount}
                keyboardType="numeric"
                placeholder="120"
              />

              <View className="flex-row gap-3 mt-2">
                <View className="flex-1">
                  <Button label="Annuler" variant="secondary" pill onPress={() => setEditing(false)} />
                </View>
                <View className="flex-1">
                  <Button
                    label="Enregistrer"
                    pill
                    onPress={() => mutation.mutate()}
                    loading={mutation.isPending}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
