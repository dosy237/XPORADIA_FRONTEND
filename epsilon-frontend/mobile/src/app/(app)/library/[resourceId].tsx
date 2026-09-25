import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import { ResourceCover } from "@/components/library/ResourceCover";
import { StarRating } from "@/components/library/StarRating";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DownloadIcon, HeartIcon } from "@/components/ui/Icon";
import { RESOURCE_CATEGORY_LABELS, RESOURCE_TYPE_LABELS, SCHOOL_LEVEL_LABELS } from "@/constants/library";
import { Colors } from "@/constants/theme";
import * as libraryApi from "@/services/library";

export default function ResourceDetailScreen() {
  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  const queryClient = useQueryClient();
  const queryKey = ["library-resource", resourceId];

  const { data: resource, isLoading } = useQuery({
    queryKey,
    queryFn: () => libraryApi.fetchLibraryResource(resourceId),
    enabled: !!resourceId,
  });

  const favoriteMutation = useMutation({
    mutationFn: () =>
      resource!.is_favorited
        ? libraryApi.unfavoriteLibraryResource(resource!.id)
        : libraryApi.favoriteLibraryResource(resource!.id),
    onSuccess: () => {
      queryClient.setQueryData<typeof resource>(queryKey, (prev) =>
        prev ? { ...prev, is_favorited: !prev.is_favorited } : prev
      );
    },
  });

  const rateMutation = useMutation({
    mutationFn: (score: number) => libraryApi.rateLibraryResource(resourceId, score),
    onSuccess: (_data, score) => {
      // Optimiste léger : la vraie moyenne recalculée arrivera au prochain
      // rechargement, mais on reflète tout de suite le choix de l'utilisateur.
      queryClient.setQueryData<typeof resource>(queryKey, (prev) => (prev ? { ...prev, my_rating: score } : prev));
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer votre note."),
  });

  const archiveMutation = useMutation({
    mutationFn: () => libraryApi.archiveLibraryResource(resourceId),
    onSuccess: () => router.back(),
  });

  const handleOpen = () => {
    if (!resource) return;
    libraryApi.trackLibraryResourceDownload(resource.id).catch(() => undefined);
    if (resource.pdf_file) {
      router.push(
        `/(app)/library/pdf-viewer?url=${encodeURIComponent(resource.pdf_file)}&title=${encodeURIComponent(resource.title)}`
      );
      return;
    }
    Linking.openURL(resource.file_url).catch(() => Alert.alert("Erreur", "Impossible d'ouvrir ce lien."));
  };

  if (isLoading || !resource) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="pb-12">
      <ResourceCover uri={resource.cover_image} width="100%" height={220} />

      <View className="p-6 gap-4">
        <View className="gap-1.5">
          <Text className="text-xl font-bold text-xporadia-navy">{resource.title}</Text>
          <Text className="text-xs text-xporadia-text-secondary">{resource.author_name}</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <StarRating value={Number(resource.avg_rating)} size={16} />
          <Text className="text-xs text-xporadia-text-secondary">
            {resource.ratings_count > 0
              ? `${resource.avg_rating}/5 · ${resource.ratings_count} avis`
              : "Pas encore d'avis"}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-1.5">
          <Chip label={RESOURCE_CATEGORY_LABELS[resource.category]} variant="orange" />
          <Chip label={resource.subject} variant="navy-subtle" />
          <Chip label={SCHOOL_LEVEL_LABELS[resource.level]} variant="navy-subtle" />
          <Chip label={RESOURCE_TYPE_LABELS[resource.resource_type]} variant="neutral" />
        </View>

        {resource.description ? (
          <Text className="text-sm text-xporadia-text-secondary leading-6">{resource.description}</Text>
        ) : null}

        <Button
          label={resource.pdf_file ? "Ouvrir" : "Consulter"}
          onPress={handleOpen}
        />

        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Button
              label={resource.is_favorited ? "Dans mes favoris" : "Ajouter aux favoris"}
              variant="secondary"
              onPress={() => favoriteMutation.mutate()}
            />
          </View>
          <View className="h-12 w-12 rounded-xl border border-xporadia-border items-center justify-center">
            <HeartIcon size={18} color={Colors.orange} filled={resource.is_favorited} />
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 shadow-soft gap-2 items-center">
          <Text className="text-xs font-semibold text-xporadia-text-secondary">Votre note</Text>
          <StarRating value={resource.my_rating ?? 0} size={22} onChange={(score) => rateMutation.mutate(score)} />
        </View>

        <View className="flex-row items-center gap-1.5">
          <DownloadIcon size={13} color={Colors.textSecondary} />
          <Text className="text-[11px] text-xporadia-text-secondary">
            {resource.download_count} consultation{resource.download_count !== 1 ? "s" : ""}
          </Text>
        </View>

        {resource.can_manage ? (
          <Text
            className="text-xs font-semibold text-xporadia-red text-center mt-2"
            onPress={() =>
              Alert.alert("Archiver la ressource", "Cette ressource ne sera plus visible dans la bibliothèque.", [
                { text: "Annuler", style: "cancel" },
                { text: "Archiver", style: "destructive", onPress: () => archiveMutation.mutate() },
              ])
            }
            suppressHighlighting
          >
            Archiver cette ressource
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
