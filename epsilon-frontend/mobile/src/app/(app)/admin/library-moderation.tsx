import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BookIcon, FileTextIcon, PencilIcon, PlusIcon, SendIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popup } from "@/components/ui/Popup";
import {
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_CATEGORY_ORDER,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ORDER,
  SCHOOL_LEVEL_LABELS,
  SCHOOL_LEVEL_ORDER,
} from "@/constants/library";
import { Colors } from "@/constants/theme";
import * as adminApi from "@/services/adminPanel";
import type { AdminLibraryResource } from "@/services/adminPanel";
import * as libraryApi from "@/services/library";
import type { ResourceCategory, ResourceType, SchoolLevel } from "@/services/library";

type SourceMode = "pdf" | "link";

interface ResourceFormValues {
  title: string;
  description: string;
  subject: string;
  level: SchoolLevel;
  resourceType: ResourceType;
  category: ResourceCategory;
  sourceMode: SourceMode;
  fileUrl: string;
  pdfFile: { uri: string; name: string; mimeType?: string | null } | null;
  coverImage: { uri: string; name: string; mimeType?: string | null } | null;
}

function emptyForm(): ResourceFormValues {
  return {
    title: "",
    description: "",
    subject: "",
    level: "tle",
    resourceType: "course",
    category: "academic",
    sourceMode: "pdf",
    fileUrl: "",
    pdfFile: null,
    coverImage: null,
  };
}

function formFromResource(resource: AdminLibraryResource): ResourceFormValues {
  return {
    title: resource.title,
    description: resource.description,
    subject: resource.subject,
    level: resource.level,
    resourceType: resource.resource_type,
    category: resource.category,
    sourceMode: resource.file_url ? "link" : "pdf",
    fileUrl: resource.file_url,
    pdfFile: null,
    coverImage: null,
  };
}

function ResourceFormFields({
  form,
  onChange,
  existingCoverImage,
  existingPdfName,
}: {
  form: ResourceFormValues;
  onChange: (next: ResourceFormValues) => void;
  existingCoverImage?: string | null;
  existingPdfName?: string | null;
}) {
  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    onChange({ ...form, coverImage: { uri: asset.uri, name: asset.fileName ?? "couverture.jpg", mimeType: asset.mimeType } });
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (result.canceled) return;
    const asset = result.assets[0];
    onChange({ ...form, pdfFile: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType } });
  };

  const previewCover = form.coverImage?.uri ?? existingCoverImage ?? null;

  return (
    <>
      <Pressable onPress={pickCover} accessibilityRole="button" accessibilityLabel="Choisir une couverture">
        {previewCover ? (
          <Image source={{ uri: previewCover }} style={{ width: "100%", height: 120, borderRadius: 12 }} contentFit="cover" />
        ) : (
          <View className="flex-row items-center justify-center gap-2 border border-xporadia-border rounded-xl py-3.5">
            <PlusIcon size={14} color={Colors.navy} />
            <Text className="text-xs font-semibold text-xporadia-navy">Couverture (optionnel)</Text>
          </View>
        )}
      </Pressable>

      <Input label="Titre" value={form.title} onChangeText={(v) => onChange({ ...form, title: v })} />
      <Input
        label="Description"
        value={form.description}
        onChangeText={(v) => onChange({ ...form, description: v })}
        multiline
        numberOfLines={3}
      />
      <Input label="Matière" value={form.subject} onChangeText={(v) => onChange({ ...form, subject: v })} />

      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Rayon</Text>
      <View className="flex-row flex-wrap gap-2">
        {RESOURCE_CATEGORY_ORDER.map((c) => (
          <Chip
            key={c}
            label={RESOURCE_CATEGORY_LABELS[c]}
            variant={form.category === c ? "navy" : "neutral"}
            onPress={() => onChange({ ...form, category: c })}
          />
        ))}
      </View>

      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Niveau</Text>
      <View className="flex-row flex-wrap gap-2">
        {SCHOOL_LEVEL_ORDER.map((l) => (
          <Chip
            key={l}
            label={SCHOOL_LEVEL_LABELS[l]}
            variant={form.level === l ? "navy" : "neutral"}
            onPress={() => onChange({ ...form, level: l })}
          />
        ))}
      </View>

      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Type</Text>
      <View className="flex-row flex-wrap gap-2">
        {RESOURCE_TYPE_ORDER.map((t) => (
          <Chip
            key={t}
            label={RESOURCE_TYPE_LABELS[t]}
            variant={form.resourceType === t ? "navy" : "neutral"}
            onPress={() => onChange({ ...form, resourceType: t })}
          />
        ))}
      </View>

      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Document</Text>
      <View className="flex-row bg-xporadia-bg rounded-full p-1 gap-1">
        <Pressable
          onPress={() => onChange({ ...form, sourceMode: "pdf" })}
          className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2.5 ${
            form.sourceMode === "pdf" ? "bg-white shadow-soft" : ""
          }`}
        >
          <FileTextIcon size={14} color={form.sourceMode === "pdf" ? Colors.orange : Colors.textSecondary} />
          <Text
            className={`text-xs font-bold ${form.sourceMode === "pdf" ? "text-xporadia-orange-text" : "text-xporadia-text-secondary"}`}
          >
            PDF
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange({ ...form, sourceMode: "link" })}
          className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2.5 ${
            form.sourceMode === "link" ? "bg-white shadow-soft" : ""
          }`}
        >
          <SendIcon size={14} color={form.sourceMode === "link" ? Colors.orange : Colors.textSecondary} />
          <Text
            className={`text-xs font-bold ${form.sourceMode === "link" ? "text-xporadia-orange-text" : "text-xporadia-text-secondary"}`}
          >
            Lien
          </Text>
        </Pressable>
      </View>

      {form.sourceMode === "pdf" ? (
        <Pressable onPress={pickPdf} className="border border-dashed border-xporadia-border rounded-2xl p-4 items-center gap-2">
          <FileTextIcon size={18} color={Colors.orange} />
          <Text className="text-xs font-semibold text-xporadia-text-primary text-center">
            {form.pdfFile ? form.pdfFile.name : (existingPdfName ?? "Choisir un fichier PDF")}
          </Text>
        </Pressable>
      ) : (
        <Input
          value={form.fileUrl}
          onChangeText={(v) => onChange({ ...form, fileUrl: v })}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
        />
      )}
    </>
  );
}

function hasSource(form: ResourceFormValues, hasExistingPdf?: boolean) {
  if (form.sourceMode === "pdf") return !!form.pdfFile || !!hasExistingPdf;
  return form.fileUrl.trim().length > 0;
}

function isFormValid(form: ResourceFormValues, hasExistingPdf?: boolean) {
  return !!form.title && !!form.subject && hasSource(form, hasExistingPdf);
}

function CatalogRow({
  resource,
  onEdit,
}: {
  resource: AdminLibraryResource;
  onEdit: (resource: AdminLibraryResource) => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => libraryApi.archiveLibraryResource(resource.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-library"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => Alert.alert("Erreur", "Impossible de retirer cette ressource."),
  });

  const confirmDelete = () => {
    Alert.alert(
      "Retirer cette ressource ?",
      `${resource.title} sera retirée de la bibliothèque de ${resource.establishment_name}.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Retirer", style: "destructive", onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">{resource.title}</Text>
        <Chip label={RESOURCE_TYPE_LABELS[resource.resource_type]} variant="orange" />
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {resource.establishment_name} · {resource.subject} · {SCHOOL_LEVEL_LABELS[resource.level]}
      </Text>
      <View className="flex-row items-center gap-2">
        <View className="flex-1" />
        <Pressable
          onPress={() => onEdit(resource)}
          accessibilityRole="button"
          accessibilityLabel={`Modifier ${resource.title}`}
          className="h-9 w-9 rounded-full bg-xporadia-bg items-center justify-center"
        >
          <PencilIcon size={15} color={Colors.navy} />
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer ${resource.title}`}
          className="h-9 w-9 rounded-full bg-xporadia-red/10 items-center justify-center"
        >
          <TrashIcon size={15} />
        </Pressable>
      </View>
    </View>
  );
}

export default function LibraryModerationScreen() {
  const queryClient = useQueryClient();

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-library"],
    queryFn: adminApi.fetchPendingLibrary,
  });

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["admin-library"],
    queryFn: adminApi.fetchAdminLibrary,
  });

  const { data: establishments } = useQuery({
    queryKey: ["admin-library-establishments"],
    queryFn: adminApi.fetchAdminLibraryEstablishments,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      adminApi.moderateLibraryResource(id, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-library"] });
      queryClient.invalidateQueries({ queryKey: ["admin-library"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
  });

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ResourceFormValues>(emptyForm());
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  const [editingResource, setEditingResource] = useState<AdminLibraryResource | null>(null);
  const [editForm, setEditForm] = useState<ResourceFormValues>(emptyForm());

  const createMutation = useMutation({
    mutationFn: () => {
      if (!establishmentId) throw new Error("no establishment");
      return libraryApi.createLibraryResource(establishmentId, {
        title: createForm.title,
        description: createForm.description,
        subject: createForm.subject,
        level: createForm.level,
        resource_type: createForm.resourceType,
        category: createForm.category,
        file_url: createForm.sourceMode === "link" ? createForm.fileUrl : undefined,
        pdfFile: createForm.sourceMode === "pdf" && createForm.pdfFile ? createForm.pdfFile : undefined,
        coverImage: createForm.coverImage ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-library"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setCreateForm(emptyForm());
      setEstablishmentId(null);
      setCreating(false);
    },
    onError: () => Alert.alert("Erreur", "Impossible de publier cette ressource."),
  });

  const editMutation = useMutation({
    mutationFn: () => {
      if (!editingResource) throw new Error("no resource");
      return libraryApi.updateLibraryResource(editingResource.id, {
        title: editForm.title,
        description: editForm.description,
        subject: editForm.subject,
        level: editForm.level,
        resource_type: editForm.resourceType,
        category: editForm.category,
        file_url: editForm.sourceMode === "link" ? editForm.fileUrl : "",
        pdfFile: editForm.sourceMode === "pdf" && editForm.pdfFile ? editForm.pdfFile : undefined,
        coverImage: editForm.coverImage ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-library"] });
      setEditingResource(null);
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer cette ressource."),
  });

  const openEdit = (resource: AdminLibraryResource) => {
    setEditForm(formFromResource(resource));
    setEditingResource(resource);
  };

  return (
    <View className="flex-1 bg-xporadia-bg">
      <ScrollView contentContainerClassName="p-6 gap-4 pb-24">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-xporadia-navy">Bibliothèque</Text>
          <Text className="text-sm text-xporadia-text-secondary">
            Catalogue et modération, tous établissements confondus.
          </Text>
        </View>

        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
          Contributions en attente
        </Text>
        {pendingLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">Chargement...</Text>
        ) : !pending || pending.length === 0 ? (
          <Text className="text-xs text-xporadia-text-secondary py-2">Rien en attente pour l&apos;instant.</Text>
        ) : (
          <View className="gap-3">
            {pending.map((resource) => (
              <View key={resource.id} className="bg-white rounded-2xl p-4 shadow-soft gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">
                    {resource.title}
                  </Text>
                  <Chip label={resource.subject} variant="navy-subtle" />
                </View>
                <Text className="text-xs text-xporadia-text-secondary">
                  {resource.author_name} · {resource.establishment_name} · {resource.level}
                </Text>
                <View className="flex-row gap-2 mt-1">
                  <View className="flex-1">
                    <Button
                      label="Rejeter"
                      variant="secondary"
                      pill
                      onPress={() => moderateMutation.mutate({ id: resource.id, approve: false })}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Approuver"
                      pill
                      onPress={() => moderateMutation.mutate({ id: resource.id, approve: true })}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase mt-2">
          Catalogue publié
        </Text>
        {catalogLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : !catalog || catalog.length === 0 ? (
          <View className="items-center gap-2 py-8">
            <BookIcon size={22} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">Aucune ressource pour l&apos;instant.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {catalog.map((resource) => (
              <CatalogRow key={resource.id} resource={resource} onEdit={openEdit} />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => {
          setCreateForm(emptyForm());
          setEstablishmentId(establishments?.[0]?.id ?? null);
          setCreating(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une ressource"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-xporadia-orange items-center justify-center shadow-deep-orange"
      >
        <PlusIcon size={22} />
      </Pressable>

      <Popup visible={creating} onClose={() => setCreating(false)}>
        <View className="gap-4">
          <Text className="text-xl font-bold text-xporadia-navy">Ajouter une ressource</Text>

          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Établissement</Text>
          <View className="flex-row flex-wrap gap-2">
            {(establishments ?? []).map((e) => (
              <Chip
                key={e.id}
                label={e.school_name}
                variant={establishmentId === e.id ? "navy" : "neutral"}
                onPress={() => setEstablishmentId(e.id)}
              />
            ))}
          </View>

          <ResourceFormFields form={createForm} onChange={setCreateForm} />
          <Button
            label="Publier"
            pill
            disabled={!establishmentId || !isFormValid(createForm)}
            loading={createMutation.isPending}
            onPress={() => createMutation.mutate()}
          />
        </View>
      </Popup>

      <Popup visible={!!editingResource} onClose={() => setEditingResource(null)}>
        <View className="gap-4">
          <Text className="text-xl font-bold text-xporadia-navy">Modifier la ressource</Text>
          <ResourceFormFields
            form={editForm}
            onChange={setEditForm}
            existingCoverImage={editingResource?.cover_image}
            existingPdfName={editingResource?.pdf_file ? "Fichier déjà en ligne" : null}
          />
          <Button
            label="Enregistrer"
            pill
            disabled={!isFormValid(editForm, !!editingResource?.pdf_file)}
            loading={editMutation.isPending}
            onPress={() => editMutation.mutate()}
          />
        </View>
      </Popup>
    </View>
  );
}
