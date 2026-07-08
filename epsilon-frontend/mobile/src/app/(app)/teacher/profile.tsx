import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
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

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as teacherApi from "@/services/teacherProfile";

export default function TeacherProfileScreen() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: teacherApi.fetchTeacherProfile,
  });

  const [subjects, setSubjects] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [location, setLocation] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");
  const [availableForTutoring, setAvailableForTutoring] = useState(false);
  const [availableForEmployment, setAvailableForEmployment] = useState(true);
  const [saved, setSaved] = useState(false);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-xporadia-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-6 pb-12">
        <View className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-full bg-white items-center justify-center mb-3"
            style={{
              shadowColor: "#FB5406",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Image
              source={require("@/assets/images/brand/icon-navy.png")}
              style={{ width: 44, height: 44 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-xl font-bold text-xporadia-navy">Mon profil</Text>
          <Text className="text-xporadia-text-secondary text-center">
            Visible par les directeurs et les parents
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-6 gap-4 shadow-deep border border-xporadia-border">
          {isLoading ? (
            <Text className="text-xporadia-text-secondary">Chargement...</Text>
          ) : (
            <>
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

              <View className="flex-row items-center justify-between py-2">
                <Text className="text-xporadia-text-primary flex-1 pr-3">
                  Disponible pour les cours particuliers
                </Text>
                <Switch
                  value={availableForTutoring}
                  onValueChange={setAvailableForTutoring}
                  trackColor={{ false: Colors.border, true: Colors.orange }}
                  thumbColor={Colors.white}
                />
              </View>

              <View className="flex-row items-center justify-between py-2">
                <Text className="text-xporadia-text-primary flex-1 pr-3">
                  Disponible pour le marché de l'emploi
                </Text>
                <Switch
                  value={availableForEmployment}
                  onValueChange={setAvailableForEmployment}
                  trackColor={{ false: Colors.border, true: Colors.orange }}
                  thumbColor={Colors.white}
                />
              </View>

              {saved ? <Text className="text-xporadia-green text-sm">Profil enregistré.</Text> : null}

              <Button
                label="Enregistrer"
                pill
                onPress={() => mutation.mutate()}
                loading={mutation.isPending}
              />
            </>
          )}
        </View>

        <Pressable onPress={() => router.back()} className="items-center mt-6">
          <Text className="text-xporadia-text-secondary">Retour au tableau de bord</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
