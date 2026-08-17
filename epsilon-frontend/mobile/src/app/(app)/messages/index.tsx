import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, BookIcon, NewspaperIcon, UserCircleIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as messagingApi from "@/services/messaging";
import type { Channel, ChannelType } from "@/services/messaging";

const CHANNEL_ICON: Record<ChannelType, typeof UsersIcon> = {
  class: UsersIcon,
  subject: BookIcon,
  direct: UserCircleIcon,
  internship: BriefcaseIcon,
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ChannelRow({ channel }: { channel: Channel }) {
  const Icon = CHANNEL_ICON[channel.channel_type];
  return (
    <Card
      onPress={() => router.push(`/(app)/messages/${channel.id}`)}
      className="flex-row items-center gap-3"
    >
      <View className="h-12 w-12 rounded-full bg-xporadia-navy/[0.08] items-center justify-center">
        <Icon size={20} color={Colors.navy} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-xporadia-text-primary" numberOfLines={1}>
            {channel.display_name}
          </Text>
          {channel.last_message ? (
            <Text className="text-[10px] text-xporadia-text-secondary">
              {formatTime(channel.last_message.created_at)}
            </Text>
          ) : null}
        </View>
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={1}>
          {channel.last_message
            ? `${channel.last_message.author_name}: ${channel.last_message.body || "Pièce jointe"}`
            : channel.subtitle}
        </Text>
      </View>
      {channel.unread_count > 0 ? <Chip label={String(channel.unread_count)} variant="orange" /> : null}
    </Card>
  );
}

export default function MessagesScreen() {
  const { data: channels, isLoading } = useQuery({ queryKey: ["channels"], queryFn: messagingApi.fetchChannels });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-3 pb-12">
      <View className="gap-1 mb-2">
        <Text className="text-2xl font-bold text-xporadia-navy">Messagerie</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Votre classe, vos matières et vos enseignants, au même endroit.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : channels && channels.length > 0 ? (
        channels.map((channel) => <ChannelRow key={channel.id} channel={channel} />)
      ) : (
        <View className="items-center gap-2 py-10">
          <NewspaperIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucune conversation pour l'instant.</Text>
        </View>
      )}
    </ScrollView>
  );
}
