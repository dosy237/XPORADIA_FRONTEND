import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import type { ReportCard } from "@/services/grading";
import { downloadPdf } from "@/utils/pdf";

/** Un bulletin publié, présenté de façon lisible directement dans
 * l'application — pas un simple lien de téléchargement froid. Moyenne
 * générale en traitement typographique dominant (même principe que
 * "Ma progression" sur le dashboard élève), rang, détail par matière
 * avec coefficient et appréciation de l'enseignant dédié, appréciation
 * du titulaire, puis un accès au PDF déjà généré. Utilisé identiquement
 * côté élève et côté parent — un bulletin publié ne change jamais selon
 * qui le consulte. */
export function ReportCardCard({ reportCard }: { reportCard: ReportCard }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!reportCard.document) return;
    setDownloading(true);
    try {
      await downloadPdf(reportCard.document, `bulletin_${reportCard.term_label.replace(/\s+/g, "_")}.pdf`);
    } catch {
      Alert.alert("Erreur", "Impossible de télécharger le PDF pour l'instant, réessayez plus tard.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View className="bg-white rounded-3xl p-5 shadow-soft gap-4">
      <Text className="text-xs font-bold text-xporadia-orange-text uppercase tracking-wide">
        {reportCard.term_label}
      </Text>

      <View className="flex-row items-end justify-between">
        <View className="flex-row items-baseline gap-1.5">
          <Text className="text-[52px] leading-[52px] font-extrabold text-xporadia-navy">
            {reportCard.general_average}
          </Text>
          <Text className="text-xs font-semibold text-xporadia-text-secondary mb-1">/20</Text>
        </View>
        <View className="items-end gap-1.5">
          <Chip
            label={`${reportCard.rank}${reportCard.rank === 1 ? "er" : "e"} / ${reportCard.class_size}`}
            variant="navy-subtle"
          />
          <Chip label={`Classe : ${reportCard.class_average}/20`} variant="neutral" />
        </View>
      </View>

      {reportCard.subject_entries.length > 0 ? (
        <View className="gap-2">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Détail par matière</Text>
          {reportCard.subject_entries.map((entry) => (
            <View key={entry.subject_name} className="bg-xporadia-bg rounded-2xl p-3 gap-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
                  {entry.subject_name}
                </Text>
                <Text className="text-[10px] text-xporadia-text-secondary">Coef {entry.coefficient}</Text>
                <Text className="text-sm font-bold text-xporadia-navy">
                  {entry.subject_average ? `${entry.subject_average}/20` : "Non noté"}
                </Text>
              </View>
              {entry.teacher_comment ? (
                <Text className="text-xs text-xporadia-text-secondary leading-4">{entry.teacher_comment}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {reportCard.homeroom_comment ? (
        <View className="bg-xporadia-orange/[0.06] border-l-4 border-xporadia-orange rounded-xl p-3 gap-1">
          <Text className="text-[10px] font-bold text-xporadia-orange-text uppercase">
            Appréciation du professeur principal
          </Text>
          <Text className="text-sm text-xporadia-text-primary leading-5">{reportCard.homeroom_comment}</Text>
        </View>
      ) : null}

      {reportCard.document ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Voir le PDF"
              variant="secondary"
              pill
              onPress={() =>
                router.push(
                  `/(app)/library/pdf-viewer?url=${encodeURIComponent(reportCard.document as string)}&title=${encodeURIComponent(`Bulletin ${reportCard.term_label}`)}`
                )
              }
            />
          </View>
          <View className="flex-1">
            <Button label="Télécharger" variant="secondary" pill loading={downloading} onPress={handleDownload} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
