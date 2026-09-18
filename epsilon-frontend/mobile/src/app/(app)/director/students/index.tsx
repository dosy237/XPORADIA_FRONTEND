import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as academicsApi from "@/services/academics";
import type { EstablishmentStudent } from "@/services/academics";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Même gabarit de carte que l'Annuaire commun ((tabs)/directory/index.tsx) :
// accent coloré à gauche, avatar + nom sur la ligne principale, sous-titre à
// hauteur réservée, ligne de puce en dessous — cohérent avec la carte
// enseignant de la vue d'ensemble équipe (Point 5).
const SUBTITLE_MIN_HEIGHT = 32;

function StudentCard({ student }: { student: EstablishmentStudent }) {
  return (
    <Card
      onPress={() =>
        router.push({
          pathname: "/(app)/director/students/[childId]",
          params: { childId: String(student.id) },
        })
      }
      className="flex-row items-center gap-3 border-l-4 border-xporadia-green"
    >
      <Avatar
        firstName={student.first_name}
        lastName={student.last_name}
        imageUri={student.avatar ?? undefined}
        size={52}
      />
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          {student.first_name} {student.last_name}
        </Text>
        <Text
          className="text-xs text-xporadia-text-secondary"
          numberOfLines={2}
          style={{ minHeight: SUBTITLE_MIN_HEIGHT }}
        >
          {student.class_name}
        </Text>
        {student.matricule ? (
          <View className="flex-row gap-1.5 mt-1">
            <Chip label={`Matricule ${student.matricule}`} variant="navy-subtle" />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export default function EstablishmentStudentsScreen() {
  const [search, setSearch] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["establishment-students"],
    queryFn: () => academicsApi.fetchEstablishmentStudents(),
  });

  const filtered = useMemo(() => {
    if (!students) return [];
    const query = normalize(search.trim());
    if (!query) return students;
    return students.filter(
      (student) =>
        normalize(`${student.first_name} ${student.last_name}`).includes(query) ||
        normalize(student.matricule).includes(query)
    );
  }, [students, search]);

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Tous les élèves inscrits dans votre établissement, toutes classes confondues.
      </Text>

      <Input placeholder="Rechercher un élève ou un matricule..." value={search} onChangeText={setSearch} />

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : filtered.length === 0 ? (
        <Card>
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">
            {students && students.length > 0
              ? "Aucun élève ne correspond à cette recherche."
              : "Aucun élève inscrit pour l'instant."}
          </Text>
        </Card>
      ) : (
        <View className="gap-3">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
