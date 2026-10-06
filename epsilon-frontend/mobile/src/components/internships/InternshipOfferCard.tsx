import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ClockIcon, PinIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { serverNow } from "@/lib/serverClock";
import type { InternshipOffer } from "@/services/internships";

interface InternshipOfferCardProps {
  offer: InternshipOffer;
  onPress?: () => void;
  /** Par défaut, le badge "Premium" si l'offre l'est. Pour un contexte où
   * un autre badge est plus pertinent (ex. "Active"/"Inactive" côté
   * entreprise), le remplacer ici plutôt que de dupliquer toute la carte. */
  topRightBadge?: ReactNode;
  /** Zone libre sous le "Publié il y a..." — boutons d'action (modifier,
   * clôturer, mettre en avant...) propres à chaque écran. */
  footer?: ReactNode;
}

/** Modèle de carte unique pour une offre de stage, partout où elle
 * apparaît (établissement, admin, entreprise, découverte publique) —
 * inspiré des grandes plateformes d'emploi (HelloWork et consorts) : logo
 * de l'entreprise identifiable au premier coup d'œil, titre du poste en
 * avant, fraîcheur de l'offre affichée, badges clés (lieu, durée, places)
 * juste en dessous. */
export function InternshipOfferCard({ offer, onPress, topRightBadge, footer }: InternshipOfferCardProps) {
  const postedAgo = useRelativeTime(offer.created_at);
  const isNew = serverNow() - new Date(offer.created_at).getTime() < 48 * 60 * 60 * 1000;

  return (
    <Card onPress={onPress} accessibilityLabel={`Offre de stage ${offer.title}`} className="gap-0 p-0">
      {offer.cover_image ? (
        <View className="overflow-hidden rounded-t-xl">
          <Image source={{ uri: offer.cover_image }} style={{ width: "100%", height: 120 }} contentFit="cover" />
        </View>
      ) : null}
      <View className="p-4 gap-3">
        <View className="flex-row items-start gap-3">
          <Avatar firstName={offer.company.company_name} lastName="" imageUri={offer.company.avatar} size={44} />
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-bold text-xporadia-text-primary" numberOfLines={2}>
              {offer.title}
            </Text>
            <Text className="text-xs text-xporadia-text-secondary">{offer.company.company_name}</Text>
          </View>
          {topRightBadge ?? (offer.is_premium ? <Chip label="Premium" variant="orange" /> : null)}
        </View>

        <View className="flex-row items-center flex-wrap gap-2">
          <Chip label={offer.city} icon={<PinIcon size={11} color={Colors.navy} />} variant="navy-subtle" />
          <Chip
            label={`${offer.duration_weeks} sem.`}
            icon={<ClockIcon size={11} color={Colors.navy} />}
            variant="navy-subtle"
          />
          <Chip label={`${offer.places} place(s)`} variant="neutral" />
          {isNew ? <Chip label="Nouveau" variant="orange" /> : null}
        </View>

        <View className="flex-row items-center justify-between pt-1 border-t border-xporadia-border">
          <Text className="text-xs text-xporadia-text-secondary pt-2">{`Publié ${postedAgo}`}</Text>
          <Text className="text-xs text-xporadia-text-secondary pt-2">
            {offer.application_count} candidature{offer.application_count !== 1 ? "s" : ""}
          </Text>
        </View>

        {footer}
      </View>
    </Card>
  );
}
