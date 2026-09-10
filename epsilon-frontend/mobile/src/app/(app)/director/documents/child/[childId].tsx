import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileTextIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as documentsApi from "@/services/documents";
import type { AdministrativeDocument, AdministrativeDocumentType } from "@/services/documents";
import { downloadPdf, viewPdf } from "@/utils/pdf";

/** Année scolaire par défaut — même convention août à juillet que
 * director/tuition/index.tsx. */
function defaultSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

const DOCUMENT_TYPES: { type: AdministrativeDocumentType; label: string; description: string }[] = [
  {
    type: "attestation_scolarite",
    label: "Attestation de scolarité",
    description: "Preuve d'inscription active pour l'année en cours.",
  },
  {
    type: "certificat_scolarite",
    label: "Certificat de scolarité",
    description: "Même objet que l'attestation, formulation en \"certifie\".",
  },
  {
    type: "certificat_radiation",
    label: "Certificat de radiation",
    description: "Pour un élève qui a quitté l'établissement.",
  },
];

function DocumentHistoryRow({ document }: { document: AdministrativeDocument }) {
  const filename = `${document.reference_number}.pdf`;
  return (
    <View className="gap-2 border-b border-xporadia-border py-3">
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-xporadia-text-primary">
          {document.document_type_label}
        </Text>
        <Text className="text-xs text-xporadia-text-secondary">
          N° {document.reference_number} · {new Date(document.issued_at).toLocaleDateString("fr-FR")} ·{" "}
          {document.issued_by_name}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <Button
          label="Voir"
          variant="secondary"
          pill
          onPress={() => viewPdf(document.pdf_url, document.document_type_label, { authenticated: true, filename })}
        />
        <Button
          label="Télécharger"
          variant="secondary"
          pill
          onPress={() => downloadPdf(document.pdf_url, filename, { authenticated: true })}
        />
      </View>
    </View>
  );
}

export default function AdministrativeDocumentsScreen() {
  const { childId, childName, schoolYear: schoolYearParam } = useLocalSearchParams<{
    childId: string;
    childName?: string;
    schoolYear?: string;
  }>();
  const queryClient = useQueryClient();
  // L'année scolaire de l'inscription de l'élève (transmise depuis les
  // effectifs de la classe) prime sur l'année en cours calculée : un
  // document administratif atteste d'une inscription précise, jamais de
  // "l'année actuelle" au sens du calendrier si l'élève est par exemple
  // suivi pour une année passée (certificat de radiation).
  const [schoolYear] = useState(schoolYearParam || defaultSchoolYear());

  const documentsQueryKey = ["administrative-documents", Number(childId)];
  const { data: documents, isLoading } = useQuery({
    queryKey: documentsQueryKey,
    queryFn: () => documentsApi.fetchAdministrativeDocuments(Number(childId)),
    enabled: !!childId,
  });

  const issueMutation = useMutation({
    mutationFn: (documentType: AdministrativeDocumentType) =>
      documentsApi.issueAdministrativeDocument(Number(childId), documentType, schoolYear),
    onSuccess: (document) => {
      queryClient.setQueryData<AdministrativeDocument[] | undefined>(documentsQueryKey, (prev) =>
        prev ? [document, ...prev] : [document]
      );
      viewPdf(document.pdf_url, document.document_type_label, {
        authenticated: true,
        filename: `${document.reference_number}.pdf`,
      });
    },
    onError: () =>
      Alert.alert(
        "Erreur",
        "Impossible de générer ce document (vérifiez que l'élève a une inscription pour cette année scolaire)."
      ),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Documents administratifs de {childName ?? "cet élève"} pour l&apos;année scolaire {schoolYear}.
      </Text>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <FileTextIcon size={16} color={Colors.orange} />
          <Text className="text-sm font-semibold text-xporadia-text-primary">Émettre un document</Text>
        </View>
        {DOCUMENT_TYPES.map((item) => (
          <View key={item.type} className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-0.5">
              <Text className="text-sm text-xporadia-text-primary">{item.label}</Text>
              <Text className="text-xs text-xporadia-text-secondary">{item.description}</Text>
            </View>
            <Button
              label="Générer"
              pill
              loading={issueMutation.isPending && issueMutation.variables === item.type}
              disabled={issueMutation.isPending}
              onPress={() => issueMutation.mutate(item.type)}
            />
          </View>
        ))}
      </Card>

      <Card>
        <Text className="text-sm font-semibold text-xporadia-text-primary mb-1">Documents déjà émis</Text>
        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">Chargement...</Text>
        ) : !documents || documents.length === 0 ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">
            Aucun document émis pour l&apos;instant.
          </Text>
        ) : (
          documents.map((document) => <DocumentHistoryRow key={document.id} document={document} />)
        )}
      </Card>
    </ScrollView>
  );
}
