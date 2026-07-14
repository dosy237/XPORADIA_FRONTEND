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

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, BuildingIcon, PencilIcon, PinIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as companyApi from "@/services/companyProfile";
import { useAuthStore } from "@/store/authStore";

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 bg-xporadia-bg rounded-2xl p-3 gap-2 items-center">
      <View className="h-9 w-9 rounded-full bg-white items-center justify-center shadow-card">{icon}</View>
      <Text className="text-sm font-bold text-xporadia-navy" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] text-xporadia-text-secondary">{label}</Text>
    </View>
  );
}

export default function CompanyProfileScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["company-profile"],
    queryFn: companyApi.fetchCompanyProfile,
  });

  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!profile) return;
    setCompanyName(profile.company_name);
    setSector(profile.sector);
    setAddress(profile.address);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      companyApi.updateCompanyProfile({ company_name: companyName, sector, address }),
    onSuccess: (data) => {
      queryClient.setQueryData(["company-profile"], data);
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
          <View>
            <Avatar firstName={user?.first_name} lastName={user?.last_name} />
            {profile.is_partner && (
              <View
                className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-xporadia-orange border-2 border-white"
              />
            )}
          </View>
          <Text className="text-xl font-bold text-xporadia-navy mt-3">
            {user?.first_name} {user?.last_name}
          </Text>
          <View className="mt-2 flex-row gap-2">
            <Chip label="Entreprise" variant="navy-subtle" />
            {profile.is_partner && <Chip label="Partenaire Premium" variant="orange" />}
          </View>
        </View>

        <View className="px-6">
          {!editing ? (
            <View className="gap-5">
              <View className="bg-white rounded-3xl p-6 shadow-deep border border-xporadia-border gap-5">
                <View className="flex-row gap-3">
                  <StatBox
                    icon={<BuildingIcon color={Colors.navy} size={18} />}
                    label="Raison sociale"
                    value={profile.company_name || "—"}
                  />
                  <StatBox
                    icon={<BriefcaseIcon color={Colors.navy} size={18} />}
                    label="Secteur"
                    value={profile.sector || "—"}
                  />
                  <StatBox
                    icon={<PinIcon color={Colors.navy} size={18} />}
                    label="Adresse"
                    value={profile.address || "—"}
                  />
                </View>
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
                <Text className="text-white font-semibold">Modifier ma fiche entreprise</Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-white rounded-3xl p-5 gap-4 shadow-deep border border-xporadia-border">
              <Input label="Raison sociale" value={companyName} onChangeText={setCompanyName} />
              <Input
                label="Secteur d'activité"
                value={sector}
                onChangeText={setSector}
                placeholder="Technologies de l'éducation"
              />
              <Input label="Adresse" value={address} onChangeText={setAddress} placeholder="Plateau, Abidjan" />

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
