import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ResourceCover } from "@/components/library/ResourceCover";
import { StarRating } from "@/components/library/StarRating";
import { Chip } from "@/components/ui/Chip";
import { BookIcon, PlusIcon, SearchIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import {
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_CATEGORY_ORDER,
  SCHOOL_LEVEL_LABELS,
  SCHOOL_LEVEL_ORDER,
} from "@/constants/library";
import { Colors } from "@/constants/theme";
import * as libraryApi from "@/services/library";
import type { LibraryResource, ResourceCategory, SchoolLevel } from "@/services/library";

function ResourceTile({ resource, width = 152 }: { resource: LibraryResource; width?: number }) {
  return (
    <Pressable
      onPress={() => router.push(`/(app)/library/${resource.id}`)}
      accessibilityRole="button"
      accessibilityLabel={resource.title}
      className="bg-white rounded-2xl overflow-hidden shadow-soft"
      style={{ width }}
    >
      <View className="relative">
        <ResourceCover uri={resource.cover_image} width={width} height={112} />
        {resource.moderation_status === "pending" && resource.can_manage ? (
          <View className="absolute top-2 left-2 bg-xporadia-navy/85 rounded-full px-2 py-0.5">
            <Text className="text-[9px] font-bold text-white">En modération</Text>
          </View>
        ) : null}
      </View>
      <View className="p-2.5 gap-1.5">
        <Text className="text-xs font-bold text-xporadia-text-primary" numberOfLines={2}>
          {resource.title}
        </Text>
        <View className="flex-row items-center justify-between">
          <StarRating value={Number(resource.avg_rating)} size={11} />
          {resource.ratings_count > 0 ? (
            <Text className="text-[10px] text-xporadia-text-secondary">{resource.ratings_count}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function ResourceRow({ resources, tileWidth }: { resources: LibraryResource[]; tileWidth?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-2">
      {resources.map((r) => (
        <ResourceTile key={r.id} resource={r} width={tileWidth} />
      ))}
    </ScrollView>
  );
}

function FilterRow<T extends string>({
  label, options, labels, selected, onSelect,
}: {
  label: string;
  options: T[];
  labels: Record<T, string>;
  selected: T | null;
  onSelect: (value: T | null) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-[11px] font-bold text-xporadia-text-secondary uppercase tracking-wide">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-2">
        <Pressable onPress={() => onSelect(null)}>
          <Chip label="Tous" variant={selected === null ? "navy" : "navy-subtle"} />
        </Pressable>
        {options.map((option) => (
          <Pressable key={option} onPress={() => onSelect(option)}>
            <Chip label={labels[option]} variant={selected === option ? "navy" : "navy-subtle"} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function LibraryScreen() {
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<number | null>(null);
  const [category, setCategory] = useState<ResourceCategory | null>(null);
  const [level, setLevel] = useState<SchoolLevel | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: establishments, isLoading: establishmentsLoading } = useQuery({
    queryKey: ["my-library-establishments"],
    queryFn: libraryApi.fetchMyLibraryEstablishments,
  });

  const establishmentId = selectedEstablishmentId ?? establishments?.[0]?.id ?? null;

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["library-resources", establishmentId],
    queryFn: () => libraryApi.fetchLibraryResources(establishmentId!),
    enabled: !!establishmentId,
  });

  const allResources = resources ?? [];
  const subjects = useMemo(
    () => Array.from(new Set(allResources.map((r) => r.subject))).sort((a, b) => a.localeCompare(b, "fr")),
    [allResources]
  );

  const filtersActive = category !== null || level !== null || subject !== null || search.trim().length > 0;

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allResources.filter((r) => {
      if (category !== null && r.category !== category) return false;
      if (level !== null && r.level !== level) return false;
      if (subject !== null && r.subject !== subject) return false;
      if (query && !r.title.toLowerCase().includes(query) && !r.subject.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [allResources, category, level, subject, search]);

  // "Recommandé pour toi" si des notes existent déjà, sinon "Nouveautés" —
  // les ressources renvoyées par le backend sont déjà triées du plus
  // récent au plus ancien (ordering par défaut), donc aucun tri
  // supplémentaire n'est nécessaire pour ce second cas.
  const ratedResources = allResources.filter((r) => r.ratings_count > 0);
  const featuredResources = (
    ratedResources.length > 0
      ? [...ratedResources].sort(
          (a, b) => Number(b.avg_rating) - Number(a.avg_rating) || b.ratings_count - a.ratings_count
        )
      : allResources
  ).slice(0, 8);
  const featuredTitle = ratedResources.length > 0 ? "Recommandé pour toi" : "Nouveautés";

  const resourcesByCategory = RESOURCE_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    resources: allResources.filter((r) => r.category === cat),
  })).filter((group) => group.resources.length > 0);

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
    <View className="flex-1 bg-xporadia-bg">
      <ScrollView contentContainerClassName="p-6 gap-5 pb-16">
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
          placeholder="Rechercher un titre, une matière..."
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Rechercher dans la bibliothèque"
        />

        <View className="gap-3">
          <FilterRow
            label="Rayon"
            options={RESOURCE_CATEGORY_ORDER}
            labels={RESOURCE_CATEGORY_LABELS}
            selected={category}
            onSelect={setCategory}
          />
          <FilterRow
            label="Niveau"
            options={SCHOOL_LEVEL_ORDER}
            labels={SCHOOL_LEVEL_LABELS}
            selected={level}
            onSelect={setLevel}
          />
          {subjects.length > 0 && (
            <FilterRow
              label="Matière"
              options={subjects}
              labels={Object.fromEntries(subjects.map((s) => [s, s]))}
              selected={subject}
              onSelect={setSubject}
            />
          )}
        </View>

        {resourcesLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : filtersActive ? (
          <View className="gap-3">
            <Text className="text-base font-bold text-xporadia-navy">
              {filteredResources.length} résultat{filteredResources.length !== 1 ? "s" : ""}
            </Text>
            {filteredResources.length > 0 ? (
              <View className="flex-row flex-wrap gap-3">
                {filteredResources.map((r) => (
                  <ResourceTile key={r.id} resource={r} width={152} />
                ))}
              </View>
            ) : (
              <View className="items-center gap-2 py-10">
                <SearchIcon size={22} color={Colors.textSecondary} />
                <Text className="text-xs text-xporadia-text-secondary">Aucune ressource ne correspond.</Text>
              </View>
            )}
          </View>
        ) : allResources.length === 0 ? (
          <View className="items-center gap-2 py-10">
            <BookIcon size={22} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">Aucune ressource pour l&apos;instant.</Text>
          </View>
        ) : (
          <View className="gap-6">
            {featuredResources.length > 0 && (
              <View className="gap-3">
                <Text className="text-base font-bold text-xporadia-navy">{featuredTitle}</Text>
                <ResourceRow resources={featuredResources} tileWidth={168} />
              </View>
            )}
            {resourcesByCategory.map((group) => (
              <View key={group.category} className="gap-3">
                <Text className="text-base font-bold text-xporadia-navy">
                  {RESOURCE_CATEGORY_LABELS[group.category]}
                </Text>
                <ResourceRow resources={group.resources} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => establishmentId && router.push(`/(app)/library/publish?establishmentId=${establishmentId}`)}
        accessibilityRole="button"
        accessibilityLabel="Publier une ressource"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-xporadia-orange items-center justify-center shadow-deep-orange"
      >
        <PlusIcon size={22} />
      </Pressable>
    </View>
  );
}
