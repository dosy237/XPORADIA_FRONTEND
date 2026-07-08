import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/user";

type RegisterableRole = Extract<UserRole, "teacher" | "director" | "parent" | "company">;

const STATUS_OPTIONS: SelectOption<RegisterableRole>[] = [
  { value: "teacher", label: "Enseignant" },
  { value: "director", label: "Directeur d'établissement" },
  { value: "parent", label: "Parent d'élève" },
  { value: "company", label: "Entreprise" },
];

interface ChildForm {
  firstName: string;
  classLevel: string;
}

const emptyChild = (): ChildForm => ({ firstName: "", classLevel: "" });

export default function RegisterScreen() {
  const login = useAuthStore((s) => s.login);

  // Champs communs
  const [status, setStatus] = useState<RegisterableRole | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Enseignant
  const [subjects, setSubjects] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [teacherLocation, setTeacherLocation] = useState("");

  // Directeur
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [levelsTaught, setLevelsTaught] = useState("");

  // Parent
  const [parentLocation, setParentLocation] = useState("");
  const [children, setChildren] = useState<ChildForm[]>([emptyChild()]);

  // Entreprise
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const common = {
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
      };

      if (status === "teacher") {
        await authApi.registerTeacher({
          ...common,
          subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
          experience_years: experienceYears ? Number(experienceYears) : 0,
          location: teacherLocation,
        });
      } else if (status === "director") {
        await authApi.registerDirector({
          ...common,
          school_name: schoolName,
          address: schoolAddress,
          levels_taught: levelsTaught.split(",").map((s) => s.trim()).filter(Boolean),
        });
      } else if (status === "parent") {
        await authApi.registerParent({
          ...common,
          location: parentLocation,
          children: children
            .filter((c) => c.firstName && c.classLevel)
            .map((c) => ({ first_name: c.firstName, class_level: c.classLevel })),
        });
      } else if (status === "company") {
        await authApi.registerCompany({
          ...common,
          company_name: companyName,
          sector,
          address: companyAddress,
        });
      }

      return authApi.login(common.email, password);
    },
    onSuccess: (data) => {
      login({ user: data.user, access: data.access, refresh: data.refresh });
      router.replace("/(auth)/verify-otp");
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.email?.[0] ?? err?.response?.data?.detail ?? "Une erreur est survenue.";
      setFormError(detail);
    },
  });

  const canSubmit =
    !!status && firstName && lastName && email && password.length >= 8 &&
    (status !== "director" || (schoolName && schoolAddress)) &&
    (status !== "company" || (companyName && companyAddress));

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
        <AuthHeader title="Créer un compte" subtitle="Rejoignez la communauté Xporadia" showBack />

        <View className="px-6 pt-6 gap-4">
          <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
          <Input label="Nom" value={lastName} onChangeText={setLastName} />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="8 caractères minimum"
          />

          <Select
            label="Statut"
            placeholder="Choisissez votre profil"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
          />

          {status === "teacher" && (
            <View className="gap-4">
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
              <Input label="Localisation" value={teacherLocation} onChangeText={setTeacherLocation} placeholder="Cocody, Abidjan" />
            </View>
          )}

          {status === "director" && (
            <View className="gap-4">
              <Input label="Nom de l'établissement" value={schoolName} onChangeText={setSchoolName} />
              <Input label="Adresse" value={schoolAddress} onChangeText={setSchoolAddress} />
              <Input
                label="Niveaux enseignés"
                value={levelsTaught}
                onChangeText={setLevelsTaught}
                placeholder="Collège, Lycée, ..."
              />
            </View>
          )}

          {status === "parent" && (
            <View className="gap-4">
              <Input label="Localisation" value={parentLocation} onChangeText={setParentLocation} placeholder="Marcory" />
              <View className="gap-3">
                <Text className="font-semibold text-xporadia-text-primary">
                  Vos enfants ({children.length}/5)
                </Text>
                {children.map((child, index) => (
                  <Card key={index} className="gap-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="font-medium text-xporadia-text-primary">Enfant {index + 1}</Text>
                      {children.length > 1 ? (
                        <Pressable onPress={() => setChildren((prev) => prev.filter((_, i) => i !== index))}>
                          <Text className="text-xporadia-red text-sm">Retirer</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <Input
                      label="Prénom de l'enfant"
                      value={child.firstName}
                      onChangeText={(v) =>
                        setChildren((prev) => prev.map((c, i) => (i === index ? { ...c, firstName: v } : c)))
                      }
                    />
                    <Input
                      label="Classe"
                      value={child.classLevel}
                      onChangeText={(v) =>
                        setChildren((prev) => prev.map((c, i) => (i === index ? { ...c, classLevel: v } : c)))
                      }
                      placeholder="3eme, Terminale D, ..."
                    />
                  </Card>
                ))}
                {children.length < 5 && (
                  <Button
                    label="Ajouter un enfant"
                    variant="secondary"
                    pill
                    onPress={() => setChildren((prev) => [...prev, emptyChild()])}
                  />
                )}
              </View>
            </View>
          )}

          {status === "company" && (
            <View className="gap-4">
              <Input label="Raison sociale" value={companyName} onChangeText={setCompanyName} />
              <Input label="Secteur d'activité" value={sector} onChangeText={setSector} placeholder="BTP, Informatique, ..." />
              <Input label="Adresse" value={companyAddress} onChangeText={setCompanyAddress} />
            </View>
          )}

          {formError ? <Text className="text-xporadia-red text-sm">{formError}</Text> : null}

          <View className="mt-2">
            <Button
              label="Créer mon compte"
              pill
              onPress={() => {
                setFormError(null);
                mutation.mutate();
              }}
              loading={mutation.isPending}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
