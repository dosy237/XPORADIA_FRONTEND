import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, ClockIcon, MedalIcon, PinIcon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { serverNow } from "@/lib/serverClock";
import * as certificationApi from "@/services/certification";
import type { CertificationLevel, TrainingModule } from "@/services/certification";
import * as internshipsApi from "@/services/internships";
import type { InternshipOffer } from "@/services/internships";

type CatalogTab = "certifications" | "internships";

const LEVEL_FILTERS: CertificationLevel[] = ["bronze", "silver", "gold", "platinum", "diamond"];

// Le catalogue certification garde le look "fiche produit" : image en
// bannière, prix en médaillon superposé — pensé pour être parcouru et
// comparé, pas pour identifier une personne (voir l'annuaire) ni suivre
// une conversation (voir le fil).
function ModuleCard({ module }: { module: TrainingModule }) {
  return (
    <Card
      onPress={() => router.push(`/(tabs)/certifications/${module.id}`)}
      accessibilityLabel={`Voir le module ${module.title}`}
      className="gap-0 p-0"
    >
      {/* L'arrondi ne s'applique qu'à l'image, pas à toute la carte :
          sur certains appareils Android (police système agrandie), le
          texte en dessous a besoin de plus de hauteur que prévu — s'il
          fallait "overflow-hidden" sur toute la carte pour arrondir
          l'image, ce texte supplémentaire se retrouvait invisible,
          rogné net sans qu'on le voie. */}
      <View className="relative overflow-hidden rounded-t-xl">
        {module.cover_image ? (
          <Image source={{ uri: module.cover_image }} style={{ width: "100%", height: 140 }} contentFit="cover" />
        ) : (
          <View className="w-full h-[70px] bg-xporadia-navy/[0.06] items-center justify-center">
            <MedalIcon size={22} color={Colors.navy} />
          </View>
        )}
        <View className="absolute bottom-2 right-2 bg-white rounded-full px-3 py-1.5 shadow-card">
          <Text className="text-xs font-bold text-xporadia-navy">
            {module.price.toLocaleString("fr-FR")} FCFA
          </Text>
        </View>
        <View className="absolute top-2 left-2">
          <Chip label={LEVEL_LABELS[module.target_level]} variant="navy" />
        </View>
      </View>
      <View className="p-4 gap-2">
        <Text className="text-base font-semibold text-xporadia-text-primary">{module.title}</Text>
        <Text className="text-xs text-xporadia-text-secondary">
          {CATEGORY_LABELS[module.category] ?? module.category}
        </Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5" numberOfLines={2}>
          {module.description}
        </Text>
        <View className="flex-row items-center gap-1.5 pt-1">
          <ClockIcon size={14} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">{`${module.duration_hours}h de formation`}</Text>
        </View>
      </View>
    </Card>
  );
}

// Offres de stage — inspiré des grandes plateformes d'emploi (HelloWork
// et consorts) : logo de l'entreprise identifiable au premier coup
// d'œil, titre du poste en avant, fraîcheur de l'offre affichée, badges
// clés (lieu, durée, places) juste en dessous.
function InternshipOfferCard({ offer }: { offer: InternshipOffer }) {
  const postedAgo = useRelativeTime(offer.created_at);
  const isNew = serverNow() - new Date(offer.created_at).getTime() < 48 * 60 * 60 * 1000;

  return (
    <Card
      onPress={() => router.push(`/(tabs)/certifications/stage/${offer.id}`)}
      accessibilityLabel={`Voir l'offre de stage ${offer.title}`}
      className="gap-0 p-0"
    >
      {offer.cover_image ? (
        <View className="overflow-hidden rounded-t-xl">
          <Image source={{ uri: offer.cover_image }} style={{ width: "100%", height: 120 }} contentFit="cover" />
        </View>
      ) : null}
      <View className="p-4 gap-3">
        <View className="flex-row items-start gap-3">
          <Avatar
            firstName={offer.company.company_name}
            lastName=""
            imageUri={offer.company.avatar}
            size={44}
          />
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-bold text-xporadia-text-primary" numberOfLines={2}>
              {offer.title}
            </Text>
            <Text className="text-xs text-xporadia-text-secondary">{offer.company.company_name}</Text>
          </View>
          {offer.is_premium ? <Chip label="Premium" variant="orange" /> : null}
        </View>

        <View className="flex-row items-center flex-wrap gap-2">
          <Chip label={offer.city} icon={<PinIcon size={11} color={Colors.navy} />} variant="navy-subtle" />
          <Chip label={`${offer.duration_weeks} sem.`} icon={<ClockIcon size={11} color={Colors.navy} />} variant="navy-subtle" />
          <Chip label={`${offer.places} place(s)`} variant="neutral" />
          {isNew ? <Chip label="Nouveau" variant="orange" /> : null}
        </View>

        <View className="flex-row items-center justify-between pt-1 border-t border-xporadia-border">
          <Text className="text-[11px] text-xporadia-text-secondary pt-2">{`Publié ${postedAgo}`}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function CatalogScreen() {
  const [tab, setTab] = useState<CatalogTab>("certifications");
  const [level, setLevel] = useState<CertificationLevel | null>(null);

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["public-certification-modules", level],
    queryFn: () => certificationApi.fetchTrainingModules(level ? { target_level: level } : undefined),
    enabled: tab === "certifications",
  });

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ["public-internship-offers"],
    queryFn: () => internshipsApi.fetchInternshipOffers(),
    enabled: tab === "internships",
  });

  const isLoading = tab === "certifications" ? modulesLoading : offersLoading;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Certifications & Stages</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Le catalogue des parcours de certification et des offres de stage disponibles.
        </Text>
      </View>

      <View className="flex-row bg-white rounded-full p-1 shadow-soft">
        <Pressable
          onPress={() => setTab("certifications")}
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-full ${
            tab === "certifications" ? "bg-xporadia-navy" : "bg-transparent"
          }`}
        >
          <MedalIcon size={16} color={tab === "certifications" ? Colors.white : Colors.textSecondary} />
          <Text
            className={`text-sm font-semibold ${tab === "certifications" ? "text-white" : "text-xporadia-text-secondary"}`}
          >
            Certifications
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("internships")}
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-full ${
            tab === "internships" ? "bg-xporadia-navy" : "bg-transparent"
          }`}
        >
          <BriefcaseIcon size={16} color={tab === "internships" ? Colors.white : Colors.textSecondary} />
          <Text
            className={`text-sm font-semibold ${tab === "internships" ? "text-white" : "text-xporadia-text-secondary"}`}
          >
            Stages
          </Text>
        </Pressable>
      </View>

      {tab === "certifications" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip label="Tous niveaux" variant={level === null ? "navy" : "neutral"} onPress={() => setLevel(null)} />
          {LEVEL_FILTERS.map((lvl) => (
            <Chip key={lvl} label={LEVEL_LABELS[lvl]} variant={level === lvl ? "navy" : "neutral"} onPress={() => setLevel(lvl)} />
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View className="gap-3">
          {[0, 1, 2].map((i) => (
            <View key={i} className="h-[100px] rounded-xl bg-white/60" />
          ))}
        </View>
      ) : tab === "certifications" ? (
        modules && modules.length > 0 ? (
          <View className="gap-3">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </View>
        ) : (
          <Text className="text-sm text-xporadia-text-secondary text-center py-6">
            Aucune certification à afficher.
          </Text>
        )
      ) : offers && offers.length > 0 ? (
        <View className="gap-3">
          {offers.map((offer) => (
            <InternshipOfferCard key={offer.id} offer={offer} />
          ))}
        </View>
      ) : (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune offre de stage à afficher.
        </Text>
      )}
    </ScrollView>
  );
}
