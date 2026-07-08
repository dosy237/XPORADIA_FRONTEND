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

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, CoinIcon, PencilIcon, PinIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as teacherApi from "@/services/teacherProfile";
import { useAuthStore } from "@/store/authStore";

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 bg-xporadia-bg rounded-2xl p-3 gap-1.5 items-center">
      {icon}
      <Text className="text-sm font-bold text-xporadia-navy" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] text-xporadia-text-secondary">{label}</Text>
    </View>
  );
}

export default function TeacherProfileScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: teacherApi.fetchTeacherProfile,
  });

  const [editing, setEditing] = useState(false);

  const [subjects, setSubjects] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [location, setLocation] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");
  const [availableForTutoring, setAvailableForTutoring] = useState(false);
  const [availableForEmployment, setAvailableForEmployment] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setSubjects(profile.subjects.join(", "));
    setExperienceYears(String(profile.experience_years));
    setLocation(profile.location);
    setHourlyRate(profile.hourly_rate ?? "");
    setBio(profile.bio);
    setAvailableForTutoring(profile.available_for_tutoring);
    setAvailableForEmployment(profile.available_for_employment);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      teacherApi.updateTeacherProfile({
        subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
        experience_years: experienceYears ? Number(experienceYears) : 0,
        location,
        hourly_rate: hourlyRate || null,
        bio,
        available_for_tutoring: availableForTutoring,
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
        <View className="items-center pt-8 pb-4">
          <Avatar firstName={user?.first_name} lastName={user?.last_name} />
          <Text className="text-xl font-bold text-xporadia-navy mt-3">
            {user?.first_name} {user?.last_name}
          </Text>
          <View className="mt-2">
            <Chip label="Enseignant" variant="navy" />
          </View>
        </View>

        <View className="px-6">
          {!editing ? (
            <View className="gap-4">
              <View className="bg-white rounded-3xl p-5 shadow-deep border border-xporadia-border gap-4">
                <View className="flex-row gap-3">
                  <StatBox
                    icon={<BriefcaseIcon color={Colors.orange} size={18} />}
                    label="Expérience"
                    value={`${profile.experience_years} ans`}
                  />
                  <StatBox
                    icon={<CoinIcon color={Colors.orange} size={18} />}
                    label="Tarif / heure"
                    value={profile.hourly_rate ? `${profile.hourly_rate} F` : "—"}
                  />
                  <StatBox
                    icon={<PinIcon color={Colors.orange} size={18} />}
                    label="Localisation"
                    value={profile.location || "—"}
                  />
                </View>

                {profile.subjects.length > 0 && (
                  <View className="gap-2">
                    <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                      Matières enseignées
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {profile.subjects.map((subject) => (
                        <Chip key={subject} label={subject} variant="orange" />
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

                <View className="flex-row gap-2">
                  <Chip
                    label="Cours particuliers"
                    variant={profile.available_for_tutoring ? "orange" : "neutral"}
                  />
                  <Chip
                    label="Marché de l'emploi"
                    variant={profile.available_for_employment ? "orange" : "neutral"}
                  />
                </View>
              </View>

              <Pressable
                onPress={() => setEditing(true)}
                className="flex-row items-center justify-center gap-2 bg-xporadia-navy rounded-full py-4"
                style={{
                  shadowColor: "#0F172A",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <PencilIcon size={16} color="#FFFFFF" />
                <Text className="text-white font-semibold">Modifier mon profil</Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-white rounded-3xl p-5 gap-4 shadow-deep border border-xporadia-border">
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
                label="Tarif horaire (FCFA)"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                keyboardType="numeric"
                placeholder="5000"
              />
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
                <Text className="text-xporadia-text-primary flex-1 pr-3">Cours particuliers</Text>
                <Switch
                  value={availableForTutoring}
                  onValueChange={setAvailableForTutoring}
                  trackColor={{ false: Colors.border, true: Colors.orange }}
                  thumbColor={Colors.white}
                />
              </View>
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xporadia-text-primary flex-1 pr-3">Marché de l'emploi</Text>
                <Switch
                  value={availableForEmployment}
                  onValueChange={setAvailableForEmployment}
                  trackColor={{ false: Colors.border, true: Colors.orange }}
                  thumbColor={Colors.white}
                />
              </View>

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
