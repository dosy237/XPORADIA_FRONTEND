import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StepProgress } from "@/components/ui/StepProgress";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/user";

type RegisterableRole = Extract<UserRole, "teacher" | "director" | "parent" | "company">;

const ROLE_CARDS: { value: RegisterableRole; title: string; description: string }[] = [
  {
    value: "teacher",
    title: "Je suis enseignant",
    description: "Obtenez votre certification et accédez au marché de l'emploi Xporadia.",
  },
  {
    value: "director",
    title: "Je suis directeur d'établissement",
    description: "Recrutez des enseignants certifiés et gérez vos stages.",
  },
  {
    value: "parent",
    title: "Je suis parent",
    description: "Trouvez des cours particuliers certifiés pour vos enfants.",
  },
  {
    value: "company",
    title: "Je représente une entreprise",
    description: "Publiez des offres de stage et évaluez vos stagiaires.",
  },
];

interface ChildForm {
  firstName: string;
  classLevel: string;
}

const emptyChild = (): ChildForm => ({ firstName: "", classLevel: "" });

const TOTAL_STEPS = 3;

export default function RegisterScreen() {
  const { inviteToken, prefillEmail } = useLocalSearchParams<{
    inviteToken?: string;
    prefillEmail?: string;
  }>();
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState(inviteToken ? 2 : 1);

  const [status, setStatus] = useState<RegisterableRole | null>(inviteToken ? "teacher" : null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  const [subjects, setSubjects] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [teacherLocation, setTeacherLocation] = useState("");

  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [levelsTaught, setLevelsTaught] = useState("");

  const [parentLocation, setParentLocation] = useState("");
  const [children, setChildren] = useState<ChildForm[]>([emptyChild()]);

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
      router.replace({
        pathname: "/(auth)/verify-otp",
        params: { inviteToken: inviteToken ?? "" },
      });
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

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-xporadia-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
        <AuthHeader title="Créer un compte" subtitle="Rejoignez la communauté Xporadia" onBack={goBack} showBack />

        <View className="px-6 pt-4">
          <View className="bg-white rounded-2xl p-6 gap-5 shadow-card border border-xporadia-border">
            <StepProgress step={step} total={TOTAL_STEPS} />

            {step === 1 && (
              <View className="gap-3">
                <Text className="text-lg font-bold text-xporadia-navy mb-1">Quel est votre profil ?</Text>
                {ROLE_CARDS.map((role) => (
                  <Card
                    key={role.value}
                    onPress={() => {
                      setStatus(role.value);
                      setStep(2);
                    }}
                    selected={status === role.value}
                    className="gap-1.5"
                  >
                    <Text className="text-base font-semibold text-xporadia-text-primary">{role.title}</Text>
                    <Text className="text-sm text-xporadia-text-secondary">{role.description}</Text>
                  </Card>
                ))}
              </View>
            )}

            {step === 2 && (
              <View className="gap-4">
                <Text className="text-lg font-bold text-xporadia-navy mb-1">Vos informations</Text>
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
                <Button
                  label="Continuer"
                  pill
                  onPress={() => setStep(3)}
                  disabled={!firstName || !lastName || !email || password.length < 8}
                />
              </View>
            )}

            {step === 3 && (
              <View className="gap-4">
                <Text className="text-lg font-bold text-xporadia-navy mb-1">
                  Dernière étape
                </Text>

                {status === "teacher" && (
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
                    <Input label="Localisation" value={teacherLocation} onChangeText={setTeacherLocation} placeholder="Cocody, Abidjan" />
                  </>
                )}

                {status === "director" && (
                  <>
                    <Input label="Nom de l'établissement" value={schoolName} onChangeText={setSchoolName} />
                    <Input label="Adresse" value={schoolAddress} onChangeText={setSchoolAddress} />
                    <Input
                      label="Niveaux enseignés"
                      value={levelsTaught}
                      onChangeText={setLevelsTaught}
                      placeholder="Collège, Lycée, ..."
                    />
                  </>
                )}

                {status === "parent" && (
                  <>
                    <Input label="Localisation" value={parentLocation} onChangeText={setParentLocation} placeholder="Marcory" />
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
                  </>
                )}

                {status === "company" && (
                  <>
                    <Input label="Raison sociale" value={companyName} onChangeText={setCompanyName} />
                    <Input label="Secteur d'activité" value={sector} onChangeText={setSector} placeholder="BTP, Informatique, ..." />
                    <Input label="Adresse" value={companyAddress} onChangeText={setCompanyAddress} />
                  </>
                )}

                {formError ? <Text className="text-xporadia-red text-sm">{formError}</Text> : null}

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
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
