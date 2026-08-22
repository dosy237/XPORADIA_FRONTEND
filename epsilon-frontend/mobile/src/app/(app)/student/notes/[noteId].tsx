import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import * as studentLifeApi from "@/services/studentLife";

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const id = Number(noteId);
  const queryClient = useQueryClient();

  const { data: notes } = useQuery({ queryKey: ["personal-notes"], queryFn: studentLifeApi.fetchNotes });
  const note = notes?.find((n) => n.id === id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // Sans hauteur pilotée par onContentSizeChange, un TextInput multiline
  // garde sa hauteur figée au premier rendu sur react-native-web : une
  // note existante plus longue que min-height déborde en silence, coupée
  // sans ellipsis (même défaut que sur l'objectif de vie).
  const [contentHeight, setContentHeight] = useState(200);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.id]);

  const saveMutation = useMutation({
    mutationFn: () => studentLifeApi.updateNote(id, { title, content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-notes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => studentLifeApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-notes"] });
      router.back();
    },
  });

  const hasChanges = note && (title !== note.title || content !== note.content);

  if (!note) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="p-6 gap-4 pb-12">
        <Input value={title} onChangeText={setTitle} placeholder="Titre de la note" />
        <TextInput
          value={content}
          onChangeText={setContent}
          onContentSizeChange={(e) => setContentHeight(Math.max(200, e.nativeEvent.contentSize.height))}
          placeholder="Écrivez votre note ici..."
          placeholderTextColor="#94A3B8"
          multiline
          style={{ height: contentHeight }}
          className="text-sm text-xporadia-text-primary bg-white rounded-xl p-4 shadow-soft"
          textAlignVertical="top"
        />

        {hasChanges ? (
          <Button label="Enregistrer" pill onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} />
        ) : null}

        <Text
          className="text-xs text-xporadia-red text-center font-medium"
          suppressHighlighting
          onPress={() =>
            Alert.alert("Supprimer la note", "Cette action est définitive.", [
              { text: "Annuler", style: "cancel" },
              { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate() },
            ])
          }
        >
          Supprimer cette note
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
