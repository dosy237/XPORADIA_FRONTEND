import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BookIcon, DownloadIcon, HeartIcon, PlusIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_ORDER, SCHOOL_LEVEL_LABELS, SCHOOL_LEVEL_ORDER } from "@/constants/library";
import { Colors } from "@/constants/theme";
import * as libraryApi from "@/services/library";
import type { LibraryResource, ResourceType, SchoolLevel } from "@/services/library";

function ResourceCard({
  resource,
  onToggleFavorite,
  onDownload,
  onArchive,
}: {
  resource: LibraryResource;
  onToggleFavorite: (resource: LibraryResource) => void;
  onDownload: (resource: LibraryResource) => void;
  onArchive: (resourceId: string) => void;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1">{resource.title}</Text>
        <Pressable
          onPress={() => onToggleFavorite(resource)}
          accessibilityRole="button"
          accessibilityLabel={
            resource.is_favorited ? `Retirer ${resource.title} des favoris` : `Ajouter ${resource.title} aux favoris`
          }
          hitSlop={8}
        >
          <HeartIcon size={18} color={Colors.orange} filled={resource.is_favorited} />
        </Pressable>
      </View>

      {resource.description ? (
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
          {resource.description}
        </Text>
      ) : null}

      <View className="flex-row flex-wrap gap-1.5">
        <Chip label={resource.subject} variant="navy-subtle" />
        <Chip label={SCHOOL_LEVEL_LABELS[resource.level]} variant="navy-subtle" />
        <Chip label={RESOURCE_TYPE_LABELS[resource.resource_type]} variant="neutral" />
      </View>

      <Text className="text-[11px] text-xporadia-text-secondary">
        {resource.author_name} · {resource.download_count} téléchargement
        {resource.download_count !== 1 ? "s" : ""}
      </Text>

      <View className="flex-row items-center gap-2 mt-1">
        <Button
          label="Ouvrir"
          pill
          onPress={() => onDownload(resource)}
        />
        {resource.can_manage && (
          <Pressable
            onPress={() =>
              Alert.alert("Archiver la ressource", "Cette ressource ne sera plus visible dans la bibliothèque.", [
                { text: "Annuler", style: "cancel" },
                { text: "Archiver", style: "destructive", onPress: () => onArchive(resource.id) },
              ])
            }
            accessibilityRole="button"
            accessibilityLabel={`Archiver ${resource.title}`}
          >
            <Text className="text-xs font-semibold text-xporadia-red">Archiver</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function LibraryScreen() {
  const queryClient = useQueryClient();
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [level, setLevel] = useState<SchoolLevel>("tle");
  const [resourceType, setResourceType] = useState<ResourceType>("course");
  const [fileUrl, setFileUrl] = useState("");

  const { data: establishments, isLoading: establishmentsLoading } = useQuery({
    queryKey: ["my-library-establishments"],
    queryFn: libraryApi.fetchMyLibraryEstablishments,
  });

  const establishmentId = selectedEstablishmentId ?? establishments?.[0]?.id ?? null;

  const resourcesQueryKey = ["library-resources", establishmentId, subject];
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: resourcesQueryKey,
    queryFn: () =>
      libraryApi.fetchLibraryResources(establishmentId!, subject ? { subject } : undefined),
    enabled: !!establishmentId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      libraryApi.createLibraryResource(establishmentId!, {
        title,
        description,
        subject: newSubject,
        level,
        resource_type: resourceType,
        file_url: fileUrl,
      }),
    onSuccess: (resource) => {
      queryClient.setQueryData<LibraryResource[] | undefined>(resourcesQueryKey, (prev) =>
        prev ? [resource, ...prev] : [resource]
      );
      setTitle("");
      setDescription("");
      setNewSubject("");
      setFileUrl("");
      setAdding(false);
    },
    onError: () => Alert.alert("Erreur", "Impossible d'ajouter cette ressource."),
  });

  const favoriteMutation = useMutation({
    mutationFn: (resource: LibraryResource) =>
      resource.is_favorited
        ? libraryApi.unfavoriteLibraryResource(resource.id)
        : libraryApi.favoriteLibraryResource(resource.id),
    onSuccess: (_data, resource) => {
      queryClient.setQueryData<LibraryResource[] | undefined>(resourcesQueryKey, (prev) =>
        prev
          ? prev.map((r) => (r.id === resource.id ? { ...r, is_favorited: !r.is_favorited } : r))
          : prev
      );
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (resourceId: string) => libraryApi.archiveLibraryResource(resourceId),
    onSuccess: (_data, resourceId) => {
      queryClient.setQueryData<LibraryResource[] | undefined>(resourcesQueryKey, (prev) =>
        prev ? prev.filter((r) => r.id !== resourceId) : prev
      );
    },
  });

  const handleDownload = async (resource: LibraryResource) => {
    libraryApi.trackLibraryResourceDownload(resource.id).catch(() => undefined);
    Linking.openURL(resource.file_url).catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir ce lien.")
    );
  };

  if (establishmentsLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!establishments || establishments.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-3">
        <BookIcon color={Colors.textSecondary} size={28} />
        <Text className="text-sm text-xporadia-text-secondary text-center">
          La bibliothèque numérique est accessible dès que vous êtes rattaché(e) à un établissement
          (titulaire, enseignant dédié, ou directeur).
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      {establishments.length > 1 && (
        <View className="flex-row flex-wrap gap-2">
          {establishments.map((e) => (
            <Pressable key={e.id} onPress={() => setSelectedEstablishmentId(e.id)}>
              <Chip label={e.school_name} variant={establishmentId === e.id ? "navy" : "navy-subtle"} />
            </Pressable>
          ))}
        </View>
      )}

      <Input
        placeholder="Rechercher par matière (ex. Maths)"
        value={subject}
        onChangeText={setSubject}
        accessibilityLabel="Rechercher une ressource par matière"
      />

      {resourcesLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (resources ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune ressource pour l&apos;instant.
        </Text>
      ) : (
        <View className="gap-3">
          {(resources ?? []).map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onToggleFavorite={(r) => favoriteMutation.mutate(r)}
              onDownload={handleDownload}
              onArchive={(id) => archiveMutation.mutate(id)}
            />
          ))}
        </View>
      )}

      {adding ? (
        <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
          <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Fiche de révision : Algèbre" />
          <Input
            label="Description (optionnel)"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Input label="Matière" value={newSubject} onChangeText={setNewSubject} placeholder="Mathématiques" />
          <Input
            label="Lien du fichier"
            value={fileUrl}
            onChangeText={setFileUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text className="text-sm font-medium text-xporadia-text-secondary">Niveau</Text>
          <View className="flex-row flex-wrap gap-2">
            {SCHOOL_LEVEL_ORDER.map((l) => (
              <Pressable key={l} onPress={() => setLevel(l)}>
                <Chip label={SCHOOL_LEVEL_LABELS[l]} variant={level === l ? "navy" : "navy-subtle"} />
              </Pressable>
            ))}
          </View>

          <Text className="text-sm font-medium text-xporadia-text-secondary">Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {RESOURCE_TYPE_ORDER.map((t) => (
              <Pressable key={t} onPress={() => setResourceType(t)}>
                <Chip label={RESOURCE_TYPE_LABELS[t]} variant={resourceType === t ? "navy" : "navy-subtle"} />
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3 mt-2">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Ajouter"
                pill
                disabled={!title || !newSubject || !fileUrl}
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
              />
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une ressource"
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5"
        >
          <PlusIcon size={16} />
          <Text className="text-white font-semibold">Ajouter une ressource</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
