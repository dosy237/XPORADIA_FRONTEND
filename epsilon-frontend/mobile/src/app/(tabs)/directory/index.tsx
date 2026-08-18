import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, BuildingIcon, SearchIcon, UsersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as companyApi from "@/services/companyDirectory";
import type { CompanyDirectoryCard } from "@/services/companyDirectory";
import * as establishmentApi from "@/services/establishmentDirectory";
import type { EstablishmentDirectoryCard } from "@/services/establishmentDirectory";
import * as directoryApi from "@/services/teacherDirectory";
import type { TeacherDirectoryCard } from "@/services/teacherDirectory";

type DirectoryFilter = "all" | "teacher" | "establishment" | "company";

const FILTERS: { value: DirectoryFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "teacher", label: "Enseignants" },
  { value: "establishment", label: "Établissements" },
  { value: "company", label: "Entreprises" },
];

function TeacherCard({ teacher }: { teacher: TeacherDirectoryCard }) {
  return (
    <Card
      onPress={() => router.push(`/(tabs)/directory/${teacher.id}`)}
      accessibilityLabel={`Voir le profil de ${teacher.first_name} ${teacher.last_name}`}
      className="flex-row items-center gap-3 border-l-4 border-xporadia-navy"
    >
      <Avatar firstName={teacher.first_name} lastName={teacher.last_name} imageUri={teacher.avatar} size={52} />
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          {teacher.first_name} {teacher.last_name}
        </Text>
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
          {teacher.subjects.join(", ") || "Matières non renseignées"}
          {teacher.location ? ` · ${teacher.location}` : ""}
        </Text>
        <View className="flex-row gap-1.5 mt-1">
          <Chip
            label={teacher.current_level ? LEVEL_LABELS[teacher.current_level] : "Non certifié"}
            variant="navy-subtle"
          />
        </View>
      </View>
    </Card>
  );
}

function EstablishmentCard({ establishment }: { establishment: EstablishmentDirectoryCard }) {
  return (
    <Card
      onPress={() => router.push(`/(tabs)/directory/establishment/${establishment.id}`)}
      accessibilityLabel={`Voir l'établissement ${establishment.school_name}`}
      className="flex-row items-center gap-3 border-l-4 border-xporadia-orange"
    >
      {establishment.avatar ? (
        <View className="h-[52px] w-[52px] rounded-full overflow-hidden bg-xporadia-navy/[0.08]">
          <Image source={{ uri: establishment.avatar }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        </View>
      ) : (
        <View className="h-[52px] w-[52px] rounded-full bg-xporadia-navy/[0.08] items-center justify-center">
          <BuildingIcon color={Colors.navy} size={24} />
        </View>
      )}
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">{establishment.school_name}</Text>
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
          {establishment.address || "Établissement"}
          {establishment.student_count ? ` · ${establishment.student_count} élèves` : ""}
        </Text>
        <View className="flex-row gap-1.5 mt-1">
          <Chip label="Établissement" variant="navy-subtle" />
          {establishment.is_partner && <Chip label="Partenaire" variant="orange" />}
        </View>
      </View>
    </Card>
  );
}

function CompanyCard({ company }: { company: CompanyDirectoryCard }) {
  return (
    <Card
      onPress={() => router.push(`/(tabs)/directory/company/${company.id}`)}
      accessibilityLabel={`Voir l'entreprise ${company.company_name}`}
      className="flex-row items-center gap-3 border-l-4 border-xporadia-purple"
    >
      {company.avatar ? (
        <View className="h-[52px] w-[52px] rounded-full overflow-hidden bg-xporadia-navy/[0.08]">
          <Image source={{ uri: company.avatar }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        </View>
      ) : (
        <View className="h-[52px] w-[52px] rounded-full bg-xporadia-navy/[0.08] items-center justify-center">
          <BriefcaseIcon color={Colors.navy} size={24} />
        </View>
      )}
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">{company.company_name}</Text>
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
          {company.sector || "Entreprise"}
          {company.address ? ` · ${company.address}` : ""}
        </Text>
        <View className="flex-row gap-1.5 mt-1">
          <Chip label="Entreprise" variant="navy-subtle" />
          {company.is_partner && <Chip label="Partenaire" variant="orange" />}
        </View>
      </View>
    </Card>
  );
}

type DirectoryItem =
  | { type: "teacher"; data: TeacherDirectoryCard }
  | { type: "establishment"; data: EstablishmentDirectoryCard }
  | { type: "company"; data: CompanyDirectoryCard };

function interleave(
  teachers: TeacherDirectoryCard[],
  establishments: EstablishmentDirectoryCard[],
  companies: CompanyDirectoryCard[],
): DirectoryItem[] {
  const items: DirectoryItem[] = [];
  const max = Math.max(teachers.length, establishments.length, companies.length);
  for (let i = 0; i < max; i++) {
    if (teachers[i]) items.push({ type: "teacher", data: teachers[i] });
    if (establishments[i]) items.push({ type: "establishment", data: establishments[i] });
    if (companies[i]) items.push({ type: "company", data: companies[i] });
  }
  return items;
}

function EmptyState() {
  return (
    <View className="items-center gap-3 py-12">
      <View className="h-14 w-14 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
        <UsersIcon color={Colors.textSecondary} size={26} />
      </View>
      <View className="gap-1 items-center">
        <Text className="text-sm font-semibold text-xporadia-text-primary">Rien à afficher pour l'instant</Text>
        <Text className="text-xs text-xporadia-text-secondary text-center px-8">
          Essayez une autre matière ou revenez plus tard.
        </Text>
      </View>
    </View>
  );
}

export default function DirectoryScreen() {
  const [subject, setSubject] = useState("");
  const [filter, setFilter] = useState<DirectoryFilter>("all");

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["directory-teachers", subject],
    queryFn: () => directoryApi.fetchTeacherDirectory(subject ? { subject } : undefined),
    enabled: filter === "all" || filter === "teacher",
  });

  const { data: establishments, isLoading: establishmentsLoading } = useQuery({
    queryKey: ["directory-establishments"],
    queryFn: () => establishmentApi.fetchEstablishmentDirectory(),
    enabled: filter === "all" || filter === "establishment",
  });

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["directory-companies"],
    queryFn: () => companyApi.fetchCompanyDirectory(),
    enabled: filter === "all" || filter === "company",
  });

  const isLoading =
    (filter === "all" || filter === "teacher" ? teachersLoading : false) ||
    (filter === "all" || filter === "establishment" ? establishmentsLoading : false) ||
    (filter === "all" || filter === "company" ? companiesLoading : false);

  const items = interleave(
    filter === "all" || filter === "teacher" ? (teachers ?? []) : [],
    filter === "all" || filter === "establishment" ? (establishments ?? []) : [],
    filter === "all" || filter === "company" ? (companies ?? []) : [],
  );

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Annuaire</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Enseignants accrédités, établissements et entreprises partenaires Xporadia.
        </Text>
      </View>

      <Input
        placeholder="Rechercher par matière (ex. Maths)"
        value={subject}
        onChangeText={setSubject}
        accessibilityLabel="Rechercher un enseignant par matière"
        leftIcon={<SearchIcon size={18} color={Colors.textSecondary} />}
      />

      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            variant={filter === f.value ? "navy" : "neutral"}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </View>

      {isLoading ? (
        <View className="gap-3">
          {[0, 1, 2].map((i) => (
            <View key={i} className="h-[84px] rounded-xl bg-white/60" />
          ))}
        </View>
      ) : items.length > 0 ? (
        <View className="gap-3">
          {items.map((item) => {
            if (item.type === "teacher") return <TeacherCard key={`teacher-${item.data.id}`} teacher={item.data} />;
            if (item.type === "establishment")
              return <EstablishmentCard key={`establishment-${item.data.id}`} establishment={item.data} />;
            return <CompanyCard key={`company-${item.data.id}`} company={item.data} />;
          })}
        </View>
      ) : (
        <EmptyState />
      )}
    </ScrollView>
  );
}
