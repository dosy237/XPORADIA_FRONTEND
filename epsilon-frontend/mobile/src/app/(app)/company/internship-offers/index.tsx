import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PlusIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { InternshipOfferCard } from "@/components/internships/InternshipOfferCard";
import { Popup } from "@/components/ui/Popup";
import { Colors } from "@/constants/theme";
import * as internshipsApi from "@/services/internships";
import type { InternshipLevel, InternshipOffer } from "@/services/internships";
import { useAuthStore } from "@/store/authStore";

const LEVEL_OPTIONS: { value: InternshipLevel; label: string }[] = [
  { value: "3e", label: "3ème" },
  { value: "2nde", label: "Seconde" },
  { value: "1ere", label: "Première" },
  { value: "terminale", label: "Terminale" },
];

function OfferCard({
  offer,
  onToggleActive,
}: {
  offer: InternshipOffer;
  onToggleActive: (offer: InternshipOffer) => void;
}) {
  return (
    <InternshipOfferCard
      offer={offer}
      onPress={() =>
        router.push({
          pathname: "/(app)/company/internship-offers/[offerId]",
          params: { offerId: offer.id, title: offer.title },
        })
      }
      topRightBadge={<Chip label={offer.is_active ? "Active" : "Inactive"} variant="navy-subtle" />}
      footer={
        <Button
          label={offer.is_active ? "Désactiver" : "Réactiver"}
          variant="secondary"
          pill
          onPress={() => onToggleActive(offer)}
        />
      }
    />
  );
}

export default function CompanyInternshipOffersScreen() {
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [missions, setMissions] = useState("");
  const [city, setCity] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("4");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [level, setLevel] = useState<InternshipLevel>("terminale");
  const [coverImage, setCoverImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) setCoverImage(result.assets[0]);
  };

  const queryKey = ["my-internship-offers"];
  const { data: offers, isLoading } = useQuery({
    queryKey,
    queryFn: () => internshipsApi.fetchInternshipOffers(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const offer = await internshipsApi.createInternshipOffer({
        title,
        domain,
        missions,
        level,
        duration_weeks: Number(durationWeeks),
        period_start: periodStart,
        period_end: periodEnd,
        city,
      });
      if (coverImage) {
        return internshipsApi.uploadInternshipOfferCoverImage(offer.id, {
          uri: coverImage.uri,
          name: coverImage.fileName ?? "cover.jpg",
          mimeType: coverImage.mimeType,
        });
      }
      return offer;
    },
    onSuccess: (offer) => {
      queryClient.setQueryData<InternshipOffer[] | undefined>(queryKey, (prev) =>
        prev ? [offer, ...prev] : [offer]
      );
      setTitle("");
      setDomain("");
      setMissions("");
      setCity("");
      setPeriodStart("");
      setPeriodEnd("");
      setCoverImage(null);
      setAdding(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (offer: InternshipOffer) =>
      internshipsApi.updateInternshipOffer(offer.id, { is_active: !offer.is_active }),
    onSuccess: (offer) => {
      queryClient.setQueryData<InternshipOffer[] | undefined>(queryKey, (prev) =>
        prev ? prev.map((o) => (o.id === offer.id ? offer : o)) : prev
      );
    },
  });

  const previewOffer: InternshipOffer = {
    id: "preview",
    company: {
      company_name: me ? `${me.first_name} ${me.last_name}` : "Votre entreprise",
      avatar: me?.avatar ?? null,
    } as InternshipOffer["company"],
    title: title || "Titre du stage",
    domain: domain || "Domaine",
    missions: missions,
    level,
    duration_weeks: Number(durationWeeks) || 0,
    period_start: periodStart,
    period_end: periodEnd,
    places: 1,
    city: city || "Ville",
    skills_wanted: [],
    cover_image: coverImage?.uri ?? null,
    is_premium: false,
    is_active: true,
    application_count: 0,
    created_at: new Date().toISOString(),
  };

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">Vos offres de stage.</Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (offers ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune offre pour l&apos;instant.
        </Text>
      ) : (
        (offers ?? []).map((offer) => (
          <OfferCard key={offer.id} offer={offer} onToggleActive={(o) => toggleMutation.mutate(o)} />
        ))
      )}

      <Pressable
        onPress={() => setAdding(true)}
        accessibilityRole="button"
        accessibilityLabel="Publier une offre de stage"
        className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5"
      >
        <PlusIcon size={16} />
        <Text className="text-white font-semibold">Publier une offre de stage</Text>
      </Pressable>

      <Popup visible={adding} onClose={() => setAdding(false)}>
        <View className="gap-4">
          <Text className="text-xl font-bold text-xporadia-navy">Publier une offre de stage</Text>

          <View className="gap-2">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Aperçu</Text>
            <InternshipOfferCard offer={previewOffer} />
          </View>

          <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Stage développeur web" />
          <Input label="Domaine" value={domain} onChangeText={setDomain} placeholder="Informatique" />
          <Input
            label="Missions"
            value={missions}
            onChangeText={setMissions}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top" }}
          />
          <Input label="Ville" value={city} onChangeText={setCity} placeholder="Abidjan" />

          <Pressable onPress={pickCoverImage} accessibilityRole="button" accessibilityLabel="Choisir une image de couverture">
            {coverImage ? (
              <Image source={{ uri: coverImage.uri }} style={{ width: "100%", height: 120, borderRadius: 12 }} contentFit="cover" />
            ) : (
              <View className="flex-row items-center justify-center gap-2 border border-xporadia-border rounded-xl py-3.5">
                <PlusIcon size={14} color={Colors.navy} />
                <Text className="text-xs font-semibold text-xporadia-navy">Image de couverture (optionnel)</Text>
              </View>
            )}
          </Pressable>
          <Input
            label="Durée (semaines)"
            value={durationWeeks}
            onChangeText={setDurationWeeks}
            keyboardType="numeric"
          />
          <Input
            label="Date de début (AAAA-MM-JJ)"
            value={periodStart}
            onChangeText={setPeriodStart}
            placeholder="2026-02-01"
          />
          <Input
            label="Date de fin (AAAA-MM-JJ)"
            value={periodEnd}
            onChangeText={setPeriodEnd}
            placeholder="2026-03-01"
          />

          <Text className="text-sm font-medium text-xporadia-text-secondary">Niveau</Text>
          <View className="flex-row flex-wrap gap-2">
            {LEVEL_OPTIONS.map((opt) => (
              <Pressable key={opt.value} onPress={() => setLevel(opt.value)}>
                <Chip label={opt.label} variant={level === opt.value ? "navy" : "navy-subtle"} />
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Créer"
                pill
                disabled={!title || !domain || !missions || !city || !periodStart || !periodEnd}
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
              />
            </View>
          </View>
        </View>
      </Popup>
    </ScrollView>
  );
}
