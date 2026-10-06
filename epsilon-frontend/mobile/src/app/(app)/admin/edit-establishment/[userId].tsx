import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import * as adminUsersApi from "@/services/adminUsers";

export default function AdminEditEstablishmentScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const id = Number(userId);
  const queryClient = useQueryClient();

  const { data: establishment, isLoading } = useQuery({
    queryKey: ["admin-establishment", id],
    queryFn: () => adminUsersApi.fetchAdminEstablishment(id),
    enabled: !!id,
  });

  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [levelsTaught, setLevelsTaught] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [establishmentCode, setEstablishmentCode] = useState("");

  useEffect(() => {
    if (!establishment) return;
    setSchoolName(establishment.school_name);
    setAddress(establishment.address);
    setLevelsTaught(establishment.levels_taught.join(", "));
    setStudentCount(establishment.student_count != null ? String(establishment.student_count) : "");
    setPhone(establishment.phone);
    setContactEmail(establishment.contact_email);
    setEstablishmentCode(establishment.establishment_code);
  }, [establishment]);

  const mutation = useMutation({
    mutationFn: () =>
      adminUsersApi.updateAdminEstablishment(id, {
        school_name: schoolName.trim(),
        address: address.trim(),
        levels_taught: levelsTaught
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        student_count: studentCount ? Number(studentCount) : null,
        phone: phone.trim(),
        contact_email: contactEmail.trim(),
        establishment_code: establishmentCode.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-establishment", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      Alert.alert("Établissement mis à jour", "Les informations ont été enregistrées.");
      router.back();
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible d'enregistrer ces informations pour le moment.");
    },
  });

  if (isLoading || !establishment) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Modifier l&apos;établissement</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          La structure académique (départements, filières, classes) reste gérée par le directeur
          lui-même, seules les informations générales sont modifiables ici.
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-5 gap-4 shadow-soft">
        <Input label="Nom de l'établissement" value={schoolName} onChangeText={setSchoolName} />
        <Input label="Adresse" value={address} onChangeText={setAddress} />
        <Input
          label="Niveaux enseignés"
          value={levelsTaught}
          onChangeText={setLevelsTaught}
          placeholder="Primaire, Collège, Lycée"
        />
        <Input
          label="Effectif déclaré"
          value={studentCount}
          onChangeText={setStudentCount}
          keyboardType="number-pad"
        />
        <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input
          label="Email de contact"
          value={contactEmail}
          onChangeText={setContactEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input label="Code établissement" value={establishmentCode} onChangeText={setEstablishmentCode} />

        <Button
          label="Enregistrer"
          pill
          loading={mutation.isPending}
          disabled={!schoolName.trim() || !address.trim()}
          onPress={() => mutation.mutate()}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}
