import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BookIcon, BriefcaseIcon, BuildingIcon, GraduationCapIcon, UsersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import * as adminManagementApi from "@/services/adminManagement";
import type { CreatableRole } from "@/services/adminManagement";

const ROLE_CARDS: {
  value: CreatableRole;
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { value: "student", title: "Élève", icon: GraduationCapIcon },
  { value: "teacher", title: "Enseignant", icon: BookIcon },
  { value: "director", title: "Directeur d'établissement", icon: BuildingIcon },
  { value: "parent", title: "Parent", icon: UsersIcon },
  { value: "company", title: "Entreprise", icon: BriefcaseIcon },
];

export default function AdminCreateUserScreen() {
  const [role, setRole] = useState<CreatableRole | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [declaredLevel, setDeclaredLevel] = useState("");

  const reset = () => {
    setRole(null);
    setEmail("");
    setFirstName("");
    setLastName("");
    setSchoolName("");
    setAddress("");
    setCompanyName("");
    setDeclaredLevel("");
  };

  const createMutation = useMutation({
    mutationFn: () => {
      if (!role) throw new Error("no role");
      return adminManagementApi.adminCreateUser({
        role,
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        school_name: role === "director" ? schoolName.trim() : undefined,
        address: role === "director" || role === "company" ? address.trim() : undefined,
        company_name: role === "company" ? companyName.trim() : undefined,
        declared_level: role === "student" ? declaredLevel.trim() : undefined,
      });
    },
    onSuccess: () => {
      Alert.alert("Compte créé", "Les identifiants ont été envoyés par email à la personne concernée.");
      reset();
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.email?.[0] ??
        err?.response?.data?.role ??
        err?.response?.data?.detail ??
        "Impossible de créer ce compte.";
      Alert.alert("Erreur", detail);
    },
  });

  const canSubmit =
    !!role &&
    !!email.includes("@") &&
    !!firstName.trim() &&
    !!lastName.trim() &&
    (role !== "director" || (!!schoolName.trim() && !!address.trim())) &&
    (role !== "company" || (!!companyName.trim() && !!address.trim())) &&
    (role !== "student" || !!declaredLevel.trim());

  return (
    <KeyboardAwareScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Créer un compte</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Filet de secours pour quelqu&apos;un qui ne peut pas s&apos;inscrire lui-même. Les identifiants
          temporaires sont envoyés par email — l&apos;inscription normale reste ouverte à tous par ailleurs.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Profil</Text>
        {ROLE_CARDS.map((r) => {
          const RoleIcon = r.icon;
          const isSelected = role === r.value;
          return (
            <Card
              key={r.value}
              onPress={() => setRole(r.value)}
              selected={isSelected}
              className="flex-row items-center gap-3"
            >
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  isSelected ? "bg-xporadia-orange" : "bg-xporadia-bg"
                }`}
              >
                <RoleIcon size={18} color={isSelected ? "#FFFFFF" : "#5A6A8A"} />
              </View>
              <Text className="text-sm font-semibold text-xporadia-text-primary">{r.title}</Text>
            </Card>
          );
        })}
      </View>

      {role ? (
        <View className="bg-white rounded-2xl p-5 gap-4 shadow-soft">
          <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
          <Input label="Nom" value={lastName} onChangeText={setLastName} />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {role === "director" ? (
            <>
              <Input label="Nom de l'établissement" value={schoolName} onChangeText={setSchoolName} />
              <Input label="Adresse" value={address} onChangeText={setAddress} />
            </>
          ) : null}

          {role === "company" ? (
            <>
              <Input label="Raison sociale" value={companyName} onChangeText={setCompanyName} />
              <Input label="Adresse" value={address} onChangeText={setAddress} />
            </>
          ) : null}

          {role === "student" ? (
            <Input
              label="Niveau"
              value={declaredLevel}
              onChangeText={setDeclaredLevel}
              placeholder="3ème, Terminale D, ..."
            />
          ) : null}

          <Button
            label="Créer le compte"
            pill
            disabled={!canSubmit}
            loading={createMutation.isPending}
            onPress={() => createMutation.mutate()}
          />
        </View>
      ) : null}
    </KeyboardAwareScrollView>
  );
}
