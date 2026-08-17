import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, MedalIcon, PencilIcon, PinIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StatBox } from "@/components/ui/StatBox";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import { openInMaps } from "@/lib/openInMaps";
import * as certificationApi from "@/services/certification";
import * as teacherApi from "@/services/teacherProfile";
import { useAuthStore } from "@/store/authStore";

export default function TeacherProfileScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: teacherApi.fetchTeacherProfile,
  });
  const { data: certStatus } = useQuery({
    queryKey: ["my-certification-status"],
    queryFn: certificationApi.fetchMyCertificationStatus,
  });

  const [editing, setEditing] = useState(false);

  const [subjects, setSubjects] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [availableForEmployment, setAvailableForEmployment] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setSubjects(profile.subjects.join(", "));
    setExperienceYears(String(profile.experience_years));
    setLocation(profile.location);
    setBio(profile.bio);
    setAvailableForEmployment(profile.available_for_employment);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      teacherApi.updateTeacherProfile({
        subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
        experience_years: experienceYears ? Number(experienceYears) : 0,
        location,
        bio,
        available_for_employment: availableForEmployment,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["teacher-profile"], data);
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-12">
        <View className="items-center pt-10 pb-5 overflow-hidden">
          <View
            className="absolute -top-6 -left-10 h-44 w-44 rounded-full bg-xporadia-navy/[0.05]"
            pointerEvents="none"
          />
          <View
            className="absolute -top-8 -right-12 h-32 w-32 rounded-full bg-xporadia-orange/[0.07]"
            pointerEvents="none"
          />
          <AvatarPicker firstName={user?.first_name} lastName={user?.last_name} imageUri={user?.avatar} />
          <Text className="text-xl font-bold text-xporadia-navy mt-3">
            {user?.first_name} {user?.last_name}
          </Text>
          <View className="mt-2 flex-row gap-2">
            <Chip label="Enseignant" variant="navy-subtle" />
            {certStatus?.current_level && (
              <Chip label={`${LEVEL_LABELS[certStatus.current_level]} · ${certStatus.total_points} pts`} variant="orange" />
            )}
          </View>
        </View>

        <View className="px-6">
          {!editing ? (
            <View className="gap-5">
              <View className="bg-white rounded-3xl p-6 shadow-soft gap-5">
                <View className="flex-row gap-3">
                  <StatBox
                    icon={<BriefcaseIcon color={Colors.navy} size={18} />}
                    label="Expérience"
                    value={`${profile.experience_years} ans`}
                  />
                  <StatBox
                    icon={<MedalIcon color={Colors.navy} size={18} />}
                    label="Niveau"
                    value={certStatus?.current_level ? LEVEL_LABELS[certStatus.current_level] : "Aucun"}
                  />
                  <StatBox
                    icon={<PinIcon color={Colors.navy} size={18} />}
                    label="Localisation"
                    value={profile.location || "Non renseigné"}
                    onPress={profile.location ? () => openInMaps(profile.location) : undefined}
                  />
                </View>

                {profile.subjects.length > 0 && (
                  <View className="gap-2">
                    <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                      Matières enseignées
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {profile.subjects.map((subject) => (
                        <Chip key={subject} label={subject} variant="navy-subtle" />
                      ))}
                    </View>
                  </View>
                )}

                {profile.bio ? (
                  <View className="gap-1">
                    <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Bio</Text>
                    <Text className="text-sm text-xporadia-text-primary leading-5">{profile.bio}</Text>
                  </View>
                ) : null}

                <Chip
                  label={profile.available_for_employment ? "Ouvert au marché de l'emploi" : "Non disponible actuellement"}
                  variant={profile.available_for_employment ? "navy-subtle" : "neutral"}
                />
              </View>

              <Pressable
                onPress={() => setEditing(true)}
                className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-4 shadow-deep-orange"
              >
                <PencilIcon size={16} color="#FFFFFF" />
                <Text className="text-white font-semibold">Modifier mon profil</Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-white rounded-3xl p-5 gap-4 shadow-soft">
              <Input
                label="Matières enseignées"
                value={subjects}
                onChangeText={setSubjects}
                placeholder="Maths, Physique, ..."
              />
              <Input
                label="Années d'expérience"
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="numeric"
              />
              <Input label="Localisation" value={location} onChangeText={setLocation} placeholder="Cocody, Abidjan" />
              <Input
                label="Bio professionnelle"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                style={{ height: 96, textAlignVertical: "top" }}
                placeholder="Présentez-vous en quelques lignes..."
              />

              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xporadia-text-primary flex-1 pr-3">Ouvert au marché de l&apos;emploi</Text>
                <Switch
                  value={availableForEmployment}
                  onValueChange={setAvailableForEmployment}
                  disabled={!profile.is_documents_validated}
                  trackColor={{ false: Colors.border, true: Colors.navy }}
                  thumbColor={Colors.white}
                />
              </View>
              {!profile.is_documents_validated && (
                <Text className="text-xs text-xporadia-text-secondary -mt-2">
                  Cette disponibilité s&apos;activera une fois votre compte accrédité par Xporadia.
                </Text>
              )}
              {mutation.isError && (
                <Text className="text-xs text-xporadia-red">
                  La mise à jour a échoué. Vérifiez que votre compte est accrédité.
                </Text>
              )}

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
