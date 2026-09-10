import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { DeadlinePicker } from "@/components/messaging/DeadlinePicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CloseIcon, FileTextIcon, ImageIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as messagingApi from "@/services/messaging";
import type { ExerciseKind, LocalAsset } from "@/services/messaging";

export default function PublishExerciseScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [kind, setKind] = useState<ExerciseKind>("homework");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [attachment, setAttachment] = useState<LocalAsset | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setAttachment({ uri: asset.uri, name: asset.fileName ?? "piece-jointe.jpg", mimeType: asset.mimeType });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
    if (result.canceled) return;
    const asset = result.assets[0];
    setAttachment({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  };

  const publishMutation = useMutation({
    mutationFn: () =>
      messagingApi.publishExercise(Number(channelId), {
        title: title.trim(),
        instructions: instructions.trim(),
        kind,
        deadline: deadline!.toISOString(),
        attachments: attachment ? [attachment] : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-messages", Number(channelId)] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      router.back();
    },
    onError: (error: unknown) => {
      const detail = (error as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const message = detail ? Object.values(detail).flat().join(" ") : null;
      Alert.alert("Erreur", message || "Impossible de publier ce devoir.");
    },
  });

  const canSubmit = !!title.trim() && !!instructions.trim() && !!deadline;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-16">
      <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Devoir n°3 : le cycle de l'eau" />
      <Input
        label="Consignes"
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Faire le schéma page 40, exercices 1 à 3."
        multiline
        numberOfLines={4}
        style={{ height: 96, textAlignVertical: "top" }}
      />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-xporadia-text-secondary">Type</Text>
        <View className="flex-row gap-2">
          <Pressable onPress={() => setKind("homework")}>
            <Chip label="Devoir" variant={kind === "homework" ? "navy" : "navy-subtle"} />
          </Pressable>
          <Pressable onPress={() => setKind("exam")}>
            <Chip label="Examen" variant={kind === "exam" ? "navy" : "navy-subtle"} />
          </Pressable>
        </View>
      </View>

      <DeadlinePicker value={deadline} onChange={setDeadline} />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-xporadia-text-secondary">Pièce jointe (optionnel)</Text>
        {attachment ? (
          <View className="flex-row items-center gap-2 border border-xporadia-border rounded-2xl px-4 py-3">
            <FileTextIcon size={14} color={Colors.orange} />
            <Text className="text-sm text-xporadia-text-primary flex-1" numberOfLines={1}>
              {attachment.name}
            </Text>
            <Pressable
              onPress={() => setAttachment(null)}
              accessibilityRole="button"
              accessibilityLabel="Retirer la pièce jointe"
              hitSlop={8}
            >
              <CloseIcon size={14} color={Colors.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row gap-2">
            <Pressable
              onPress={pickImage}
              className="flex-1 flex-row items-center justify-center gap-2 border border-dashed border-xporadia-border rounded-2xl py-3"
            >
              <ImageIcon size={14} color={Colors.textSecondary} />
              <Text className="text-xs font-semibold text-xporadia-text-secondary">Photo</Text>
            </Pressable>
            <Pressable
              onPress={pickFile}
              className="flex-1 flex-row items-center justify-center gap-2 border border-dashed border-xporadia-border rounded-2xl py-3"
            >
              <FileTextIcon size={14} color={Colors.textSecondary} />
              <Text className="text-xs font-semibold text-xporadia-text-secondary">PDF</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Button
        label="Publier le devoir"
        disabled={!canSubmit}
        loading={publishMutation.isPending}
        onPress={() => publishMutation.mutate()}
      />
    </ScrollView>
  );
}
