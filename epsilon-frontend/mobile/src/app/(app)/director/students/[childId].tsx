import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import * as academicsApi from "@/services/academics";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Text className="text-[11px] font-semibold uppercase text-xporadia-text-secondary">{label}</Text>
      <Text className="text-sm text-xporadia-text-primary">{value || "—"}</Text>
    </View>
  );
}

export default function StudentOverviewScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-overview", Number(childId)],
    queryFn: () => academicsApi.fetchStudentOverview(Number(childId)),
    enabled: !!childId,
  });

  if (isLoading || !student) {
    return (
      <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6">
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      </ScrollView>
    );
  }

  const fullName = `${student.first_name} ${student.last_name}`.trim();
  const bornOn = student.birth_date
    ? new Date(student.birth_date).toLocaleDateString("fr-FR")
    : "";

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Card className="items-center gap-3">
        <Avatar firstName={student.first_name} lastName={student.last_name} imageUri={student.avatar ?? undefined} size={72} />
        <View className="items-center gap-0.5">
          <Text className="text-lg font-bold text-xporadia-text-primary">{fullName}</Text>
          <Text className="text-xs text-xporadia-text-secondary">{student.class_name}</Text>
        </View>
      </Card>

      <Card className="gap-3">
        <Text className="text-sm font-semibold text-xporadia-text-primary">Identité</Text>
        <View className="flex-row flex-wrap gap-4">
          <InfoRow label="Matricule" value={student.matricule} />
          <InfoRow label="Sexe" value={student.sex_label} />
          <InfoRow label="Nationalité" value={student.nationality} />
          <InfoRow
            label="Né(e) le"
            value={bornOn ? `${bornOn}${student.birth_place ? ` à ${student.birth_place}` : ""}` : ""}
          />
        </View>
      </Card>

      <Card className="gap-3">
        <Text className="text-sm font-semibold text-xporadia-text-primary">Contact parent</Text>
        <InfoRow label="Nom" value={student.parent_name} />
        <InfoRow label="Téléphone" value={student.parent_phone} />
        <InfoRow label="E-mail" value={student.parent_email} />
      </Card>

      <Card className="gap-2">
        <Text className="text-sm font-semibold text-xporadia-text-primary">Accès rapide</Text>
        <Button
          label="Frais de scolarité"
          variant="secondary"
          pill
          onPress={() =>
            router.push({
              pathname: "/(app)/director/tuition/child/[childId]",
              params: { childId: String(student.id) },
            })
          }
        />
        <Button
          label="Documents administratifs"
          variant="secondary"
          pill
          onPress={() =>
            router.push({
              pathname: "/(app)/director/documents/child/[childId]",
              params: { childId: String(student.id), childName: student.first_name, schoolYear: student.school_year },
            })
          }
        />
        <Button
          label="Suivi disciplinaire"
          variant="secondary"
          pill
          onPress={() =>
            router.push({
              pathname: "/(app)/director/discipline/child/[childId]",
              params: { childId: String(student.id), childName: student.first_name },
            })
          }
        />
      </Card>
    </ScrollView>
  );
}
