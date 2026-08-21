import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import { ResourceCover } from "@/components/library/ResourceCover";
import { WebImageCropper } from "@/components/library/WebImageCropper";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FileTextIcon, SendIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import {
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_CATEGORY_ORDER,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ORDER,
  SCHOOL_LEVEL_LABELS,
  SCHOOL_LEVEL_ORDER,
} from "@/constants/library";
import { Colors } from "@/constants/theme";
import * as libraryApi from "@/services/library";
import type { ResourceCategory, ResourceType, SchoolLevel } from "@/services/library";

type SourceMode = "pdf" | "link";

export default function PublishResourceScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState<SchoolLevel>("tle");
  const [resourceType, setResourceType] = useState<ResourceType>("course");
  const [category, setCategory] = useState<ResourceCategory>("academic");
  const [coverImage, setCoverImage] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  // `allowsEditing` (recadrage natif d'expo-image-picker) n'a aucun effet
  // sur le web — le sélecteur de fichier du navigateur s'ouvre directement
  // sans étape de recadrage. Sur cette seule plateforme, l'image choisie
  // est retenue ici en attendant que WebImageCropper produise la version
  // recadrée, plutôt que d'être utilisée telle quelle.
  const [webCropSource, setWebCropSource] = useState<string | null>(null);

  const [sourceMode, setSourceMode] = useState<SourceMode>("pdf");
  const [pdfFile, setPdfFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: Platform.OS !== "web", aspect: [3, 4], quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (Platform.OS === "web") {
      setWebCropSource(asset.uri);
      return;
    }
    setCoverImage({ uri: asset.uri, name: asset.fileName ?? "couverture.jpg", mimeType: asset.mimeType });
  };

  const handleWebCropConfirm = (file: File) => {
    setCoverImage({ uri: URL.createObjectURL(file), name: file.name, mimeType: file.type });
    setWebCropSource(null);
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPdfFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      libraryApi.createLibraryResource(Number(establishmentId), {
        title,
        description,
        subject,
        level,
        resource_type: resourceType,
        category,
        file_url: sourceMode === "link" ? fileUrl : undefined,
        pdfFile: sourceMode === "pdf" && pdfFile ? pdfFile : undefined,
        coverImage: coverImage ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-resources", Number(establishmentId)] });
      router.back();
    },
    onError: (error: unknown) => {
      // Alert.alert() est un no-op sur react-native-web (voir Icon.tsx/
      // exercise-overview) : sans ce bandeau, tout échec de publication
      // passait totalement inaperçu sur web, sans aucun message affiché.
      const response = (error as { response?: { status?: number; data?: Record<string, string[]> } })?.response;
      if (!response) {
        setErrorMessage(
          "Échec de l'envoi. Le fichier est peut-être trop volumineux pour votre connexion, ou celle-ci a été interrompue. Réessayez, si besoin avec un fichier plus léger."
        );
        return;
      }
      const detail = response.data ? Object.values(response.data).flat().join(" ") : null;
      setErrorMessage(detail || `Impossible de publier cette ressource (erreur ${response.status ?? ""}).`);
    },
  });

  const hasSource = sourceMode === "pdf" ? !!pdfFile : fileUrl.trim().length > 0;
  const canSubmit = !!title && !!subject && hasSource;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-16">
      <Pressable onPress={pickCover} accessibilityRole="button" accessibilityLabel="Choisir une couverture">
        {coverImage ? (
          <Image
            source={{ uri: coverImage.uri }}
            style={{ width: "100%", height: 160, borderRadius: 16 }}
            contentFit="cover"
          />
        ) : (
          <ResourceCover uri={null} width="100%" height={160} borderRadius={16} />
        )}
        <Text className="text-xs font-semibold text-xporadia-orange-text text-center mt-2">
          {coverImage ? "Changer la couverture" : "Ajouter une couverture (optionnel)"}
        </Text>
      </Pressable>

      <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Fiche de révision : Algèbre" />
      <Input label="Description (optionnel)" value={description} onChangeText={setDescription} multiline />
      <Input label="Matière" value={subject} onChangeText={setSubject} placeholder="Mathématiques" />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-xporadia-text-secondary">Rayon</Text>
        <View className="flex-row flex-wrap gap-2">
          {RESOURCE_CATEGORY_ORDER.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)}>
              <Chip label={RESOURCE_CATEGORY_LABELS[c]} variant={category === c ? "navy" : "navy-subtle"} />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-xporadia-text-secondary">Niveau</Text>
        <View className="flex-row flex-wrap gap-2">
          {SCHOOL_LEVEL_ORDER.map((l) => (
            <Pressable key={l} onPress={() => setLevel(l)}>
              <Chip label={SCHOOL_LEVEL_LABELS[l]} variant={level === l ? "navy" : "navy-subtle"} />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-xporadia-text-secondary">Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {RESOURCE_TYPE_ORDER.map((t) => (
            <Pressable key={t} onPress={() => setResourceType(t)}>
              <Chip label={RESOURCE_TYPE_LABELS[t]} variant={resourceType === t ? "navy" : "navy-subtle"} />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-xporadia-text-secondary">Document</Text>
        <View className="flex-row bg-xporadia-bg rounded-full p-1 gap-1">
          <Pressable
            onPress={() => setSourceMode("pdf")}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2.5 ${
              sourceMode === "pdf" ? "bg-white shadow-soft" : ""
            }`}
          >
            <FileTextIcon size={14} color={sourceMode === "pdf" ? Colors.orange : Colors.textSecondary} />
            <Text
              className={`text-xs font-bold ${sourceMode === "pdf" ? "text-xporadia-orange-text" : "text-xporadia-text-secondary"}`}
            >
              Ajouter un PDF
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSourceMode("link")}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2.5 ${
              sourceMode === "link" ? "bg-white shadow-soft" : ""
            }`}
          >
            <SendIcon size={14} color={sourceMode === "link" ? Colors.orange : Colors.textSecondary} />
            <Text
              className={`text-xs font-bold ${sourceMode === "link" ? "text-xporadia-orange-text" : "text-xporadia-text-secondary"}`}
            >
              Ajouter un lien
            </Text>
          </Pressable>
        </View>

        {sourceMode === "pdf" ? (
          <Pressable
            onPress={pickPdf}
            className="border border-dashed border-xporadia-border rounded-2xl p-4 items-center gap-2"
          >
            <FileTextIcon size={20} color={Colors.orange} />
            <Text className="text-xs font-semibold text-xporadia-text-primary text-center">
              {pdfFile ? pdfFile.name : "Choisir un fichier PDF"}
            </Text>
            <Text className="text-[11px] text-xporadia-text-secondary text-center">
              Le PDF s&apos;ouvrira directement dans l&apos;application.
            </Text>
          </Pressable>
        ) : (
          <Input
            value={fileUrl}
            onChangeText={setFileUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />
        )}
      </View>

      {errorMessage ? (
        <View className="bg-xporadia-red/[0.08] border border-xporadia-red/40 rounded-2xl p-4">
          <Text className="text-xs font-semibold text-xporadia-red">{errorMessage}</Text>
        </View>
      ) : null}

      <Button
        label="Publier"
        disabled={!canSubmit}
        loading={createMutation.isPending}
        onPress={() => {
          setErrorMessage(null);
          createMutation.mutate();
        }}
      />

      {webCropSource ? (
        <WebImageCropper
          imageUri={webCropSource}
          aspect={[3, 4]}
          onCancel={() => setWebCropSource(null)}
          onConfirm={handleWebCropConfirm}
        />
      ) : null}
    </ScrollView>
  );
}
