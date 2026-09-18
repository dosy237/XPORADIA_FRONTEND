import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { CertificationBadge } from "@/components/ui/CertificationBadge";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { LEVEL_COLORS } from "@/constants/certificationLevels";
import * as academicsApi from "@/services/academics";
import type { TeachingStaffMember } from "@/services/academics";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Même gabarit de carte que l'Annuaire commun ((tabs)/directory/index.tsx) :
// accent navy à gauche, avatar + nom + pastille "Or et plus" sur une ligne,
// sous-titre réservé à hauteur fixe, ligne de puce de niveau teintée de la
// vraie couleur du palier — pour qu'un enseignant se reconnaisse au même
// coup d'œil ici que dans l'annuaire public. Les blocs classes/matières/
// contrat, propres à cette vue directeur (coordonnées, affectations réelles
// à l'établissement), s'ajoutent en dessous plutôt que de remplacer ce
// gabarit commun.
const SUBTITLE_MIN_HEIGHT = 32;
const BADGE_ROW_MIN_HEIGHT = 30;

function LevelChip({ level, label }: { level: TeachingStaffMember["certification_level"]; label: string }) {
  const color = LEVEL_COLORS[level];
  return (
    <View
      className="flex-row items-center rounded-full px-3 py-1.5"
      style={{ borderWidth: 1, backgroundColor: `${color}1F`, borderColor: `${color}40` }}
    >
      <Text className="text-xs font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

function TeacherCard({ teacher }: { teacher: TeachingStaffMember }) {
  return (
    <Card className="gap-3 border-l-4 border-xporadia-navy">
      <View className="flex-row items-center gap-3">
        <Avatar
          firstName={teacher.first_name}
          lastName={teacher.last_name}
          imageUri={teacher.avatar ?? undefined}
          size={52}
        />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-semibold text-xporadia-text-primary" style={{ flexShrink: 1 }}>
              {teacher.first_name} {teacher.last_name}
            </Text>
            <CertificationBadge level={teacher.certification_level} />
          </View>
          <Text
            className="text-xs text-xporadia-text-secondary"
            numberOfLines={2}
            style={{ minHeight: SUBTITLE_MIN_HEIGHT }}
          >
            {teacher.email}
            {teacher.phone ? ` · ${teacher.phone}` : ""}
          </Text>
          <View className="flex-row gap-1.5 mt-1" style={{ minHeight: BADGE_ROW_MIN_HEIGHT }}>
            <LevelChip level={teacher.certification_level} label={teacher.certification_level_label} />
          </View>
        </View>
      </View>

      {teacher.homeroom_classes.length > 0 ? (
        <View className="gap-1">
          <Text className="text-[11px] font-semibold uppercase text-xporadia-text-secondary">
            Titulaire de
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {teacher.homeroom_classes.map((className) => (
              <Chip key={className} label={className} variant="orange" />
            ))}
          </View>
        </View>
      ) : null}

      {teacher.subjects.length > 0 ? (
        <View className="gap-1">
          <Text className="text-[11px] font-semibold uppercase text-xporadia-text-secondary">
            Matières enseignées
          </Text>
          <View className="gap-1">
            {teacher.subjects.map((subject, index) => (
              <Text key={index} className="text-xs text-xporadia-text-primary">
                {subject.name} — {subject.class_name}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {teacher.recruitment ? (
        <Text className="text-xs text-xporadia-text-secondary">
          Contrat : {teacher.recruitment.contract_type_label}
          {teacher.recruitment.hourly_rate_teacher
            ? ` · ${teacher.recruitment.hourly_rate_teacher.toLocaleString("fr-FR")} FCFA/h`
            : ""}
        </Text>
      ) : null}
    </Card>
  );
}

export default function TeachingStaffScreen() {
  const [search, setSearch] = useState("");

  const { data: staff, isLoading } = useQuery({
    queryKey: ["teaching-staff"],
    queryFn: academicsApi.fetchTeachingStaff,
  });

  const filtered = useMemo(() => {
    if (!staff) return [];
    const query = normalize(search.trim());
    if (!query) return staff;
    return staff.filter((teacher) =>
      normalize(`${teacher.first_name} ${teacher.last_name}`).includes(query)
    );
  }, [staff, search]);

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Enseignants titulaires ou dédiés à au moins une classe de votre établissement, avec leurs
        coordonnées et leur charge d&apos;enseignement.
      </Text>

      <Input placeholder="Rechercher un enseignant..." value={search} onChangeText={setSearch} />

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : filtered.length === 0 ? (
        <Card>
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">
            {staff && staff.length > 0
              ? "Aucun enseignant ne correspond à cette recherche."
              : "Aucun enseignant affecté à une classe pour l'instant."}
          </Text>
        </Card>
      ) : (
        <View className="gap-3">
          {filtered.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
