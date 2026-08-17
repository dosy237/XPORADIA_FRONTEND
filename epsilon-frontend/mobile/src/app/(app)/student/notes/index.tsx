import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DownloadIcon, PlusIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as studentLifeApi from "@/services/studentLife";

type Tab = "notes" | "documents";

export default function NotesScreen() {
  const [tab, setTab] = useState<Tab>("notes");
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [documentName, setDocumentName] = useState("");
  const queryClient = useQueryClient();

  const { data: notes } = useQuery({ queryKey: ["personal-notes"], queryFn: studentLifeApi.fetchNotes });
  const { data: documents } = useQuery({
    queryKey: ["personal-documents"],
    queryFn: studentLifeApi.fetchDocuments,
  });

  const createNoteMutation = useMutation({
    mutationFn: () => studentLifeApi.createNote({ title: "Nouvelle note" }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["personal-notes"] });
      router.push(`/(app)/student/notes/${note.id}`);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!pickedFile) throw new Error("Aucun fichier sélectionné.");
      return studentLifeApi.uploadDocument(documentName.trim(), {
        uri: pickedFile.uri,
        name: pickedFile.name,
        mimeType: pickedFile.mimeType,
      });
    },
    onSuccess: () => {
      setPickedFile(null);
      setDocumentName("");
      queryClient.invalidateQueries({ queryKey: ["personal-documents"] });
    },
  });

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPickedFile(asset);
    // Nom du fichier pré-rempli (sans extension) ; l'élève peut le modifier
    // avant de confirmer, conformément au flux "importer + nommer".
    setDocumentName(asset.name.replace(/\.pdf$/i, ""));
  };

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Notes & documents</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Vos notes de révision et vos documents importés.
        </Text>
      </View>

      <View className="flex-row bg-white rounded-full p-1 shadow-soft">
        {(["notes", "documents"] as Tab[]).map((value) => (
          <Text
            key={value}
            onPress={() => setTab(value)}
            suppressHighlighting
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-full ${
              tab === value ? "bg-xporadia-navy text-white" : "text-xporadia-text-secondary"
            }`}
          >
            {value === "notes" ? "Notes" : "Documents"}
          </Text>
        ))}
      </View>

      {tab === "notes" ? (
        <View className="gap-3">
          <Button
            label="Nouvelle note"
            variant="secondary"
            pill
            onPress={() => createNoteMutation.mutate()}
            loading={createNoteMutation.isPending}
          />
          {(notes ?? []).map((note) => (
            <Card key={note.id} onPress={() => router.push(`/(app)/student/notes/${note.id}`)} className="gap-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">{note.title}</Text>
              {note.subject_name ? (
                <Text className="text-xs text-xporadia-text-secondary">{note.subject_name}</Text>
              ) : null}
              <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
                {note.content || "Note vide"}
              </Text>
            </Card>
          ))}
          {notes && notes.length === 0 ? (
            <Text className="text-xs text-xporadia-text-secondary text-center py-6">Aucune note pour l'instant.</Text>
          ) : null}
        </View>
      ) : (
        <View className="gap-3">
          {pickedFile ? (
            <Card className="gap-3">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                Nommer le document
              </Text>
              <Input value={documentName} onChangeText={setDocumentName} placeholder="Nom du document" />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button label="Annuler" variant="secondary" pill onPress={() => setPickedFile(null)} />
                </View>
                <View className="flex-1">
                  <Button
                    label="Importer"
                    pill
                    onPress={() => uploadMutation.mutate()}
                    loading={uploadMutation.isPending}
                    disabled={documentName.trim().length === 0}
                  />
                </View>
              </View>
            </Card>
          ) : (
            <Card onPress={pickDocument} className="flex-row items-center justify-center gap-2">
              <PlusIcon size={16} color={Colors.navy} />
              <Text className="text-sm font-semibold text-xporadia-navy">Importer un PDF</Text>
            </Card>
          )}
          {(documents ?? []).map((doc) => (
            <Card key={doc.id} className="flex-row items-center gap-3">
              <View className="h-10 w-10 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
                <DownloadIcon size={16} color={Colors.navy} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-xporadia-text-primary" numberOfLines={1}>
                  {doc.name}
                </Text>
                <Text className="text-[11px] text-xporadia-text-secondary">
                  {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            </Card>
          ))}
          {documents && documents.length === 0 ? (
            <Text className="text-xs text-xporadia-text-secondary text-center py-6">Aucun document importé.</Text>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}
