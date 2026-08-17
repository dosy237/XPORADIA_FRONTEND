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

const PRIMARY_SWATCHES = ["#0F172A", "#1E3A5F", "#134E4A", "#4C1D95", "#7C2D12", "#111827"];
const SECONDARY_SWATCHES = ["#FB5406", "#EA580C", "#D97706", "#DC2626", "#0EA5E9", "#059669"];

function ColorSwatchPicker({
  label,
  value,
  onChange,
  swatches,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  swatches: string[];
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">{label}</Text>
      <View className="flex-row items-center gap-2.5">
        {swatches.map((color) => (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="button"
            accessibilityLabel={`Choisir ${color}`}
            className="h-9 w-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: color,
              borderWidth: value === color ? 3 : 0,
              borderColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOpacity: value === color ? 0.25 : 0,
              shadowRadius: 4,
              elevation: value === color ? 3 : 0,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 bg-xporadia-bg rounded-2xl p-3 gap-2 items-center">
      <View className="h-9 w-9 rounded-full bg-white items-center justify-center shadow-soft">{icon}</View>
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
  const [primaryColor, setPrimaryColor] = useState("#0F172A");
  const [secondaryColor, setSecondaryColor] = useState("#FB5406");

  useEffect(() => {
    if (!profile) return;
    setCompanyName(profile.company_name);
    setSector(profile.sector);
    setAddress(profile.address);
    setPrimaryColor(profile.brand_primary_color);
    setSecondaryColor(profile.brand_secondary_color);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      companyApi.updateCompanyProfile({
        company_name: companyName,
        sector,
        address,
        brand_primary_color: primaryColor,
        brand_secondary_color: secondaryColor,
      }),
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
              <View className="bg-white rounded-3xl p-6 shadow-deep gap-5">
                <View className="flex-row gap-3">
                  <StatBox
                    icon={<BuildingIcon color={Colors.navy} size={18} />}
                    label="Raison sociale"
                    value={profile.company_name || "Non renseigné"}
                  />
                  <StatBox
                    icon={<BriefcaseIcon color={Colors.navy} size={18} />}
                    label="Secteur"
                    value={profile.sector || "Non renseigné"}
                  />
                  <StatBox
                    icon={<PinIcon color={Colors.navy} size={18} />}
                    label="Adresse"
                    value={profile.address || "Non renseigné"}
                  />
                </View>

                <View className="gap-2">
                  <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                    Couleurs de vos conventions de stage
                  </Text>
                  <View className="flex-row gap-2">
                    <View
                      className="flex-1 h-11 rounded-xl"
                      style={{ backgroundColor: profile.brand_primary_color }}
                    />
                    <View
                      className="flex-1 h-11 rounded-xl"
                      style={{ backgroundColor: profile.brand_secondary_color }}
                    />
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => setEditing(true)}
                className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-4 shadow-deep-orange"
              >
                <PencilIcon size={16} color="#FFFFFF" />
                <Text className="text-white font-semibold">Modifier ma fiche entreprise</Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-white rounded-3xl p-5 gap-5 shadow-soft">
              <Input label="Raison sociale" value={companyName} onChangeText={setCompanyName} />
              <Input
                label="Secteur d'activité"
                value={sector}
                onChangeText={setSector}
                placeholder="Technologies de l'éducation"
              />
              <Input label="Adresse" value={address} onChangeText={setAddress} placeholder="Plateau, Abidjan" />

              <ColorSwatchPicker
                label="Couleur principale (conventions PDF)"
                value={primaryColor}
                onChange={setPrimaryColor}
                swatches={PRIMARY_SWATCHES}
              />
              <ColorSwatchPicker
                label="Couleur secondaire (conventions PDF)"
                value={secondaryColor}
                onChange={setSecondaryColor}
                swatches={SECONDARY_SWATCHES}
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
