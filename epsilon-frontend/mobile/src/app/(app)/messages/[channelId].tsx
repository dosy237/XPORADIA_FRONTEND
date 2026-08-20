import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { BriefcaseIcon, BookIcon, PencilIcon, SendIcon, TrashIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { useChannelSocket } from "@/hooks/useChannelSocket";
import * as messagingApi from "@/services/messaging";
import type { Message } from "@/services/messaging";
import { useAuthStore } from "@/store/authStore";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Deux messages consécutifs du même auteur, à moins de 3 minutes d'écart,
 * se regroupent visuellement (pas d'avatar/nom répété) — pattern Telegram. */
function isGrouped(current: Message, previous?: Message) {
  if (!previous) return false;
  if (previous.author.id !== current.author.id) return false;
  const gapMs = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
  return gapMs < 3 * 60 * 1000;
}

function ChatBackground() {
  // Fond de conversation discret aux couleurs de la marque, plutôt qu'un
  // gris uniforme — assez subtil pour ne jamais gêner la lecture.
  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      <View className="absolute -top-16 -left-20 h-72 w-72 rounded-full bg-xporadia-navy/[0.035]" />
      <View className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-xporadia-orange/[0.04]" />
      <View className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-xporadia-navy/[0.03]" />
    </View>
  );
}

function MessageActionsSheet({
  visible,
  onEdit,
  onDelete,
  onClose,
}: {
  visible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Pressable className="absolute inset-0 bg-black/20 items-center justify-center px-10" onPress={onClose}>
      <View className="bg-white rounded-2xl overflow-hidden w-full shadow-deep">
        <Pressable
          onPress={onEdit}
          className="flex-row items-center gap-3 px-4 py-3.5 active:bg-xporadia-bg"
          accessibilityRole="button"
        >
          <PencilIcon size={16} color={Colors.navy} />
          <Text className="text-sm font-medium text-xporadia-text-primary">Modifier</Text>
        </Pressable>
        <View className="h-px bg-xporadia-border" />
        <Pressable
          onPress={onDelete}
          className="flex-row items-center gap-3 px-4 py-3.5 active:bg-xporadia-bg"
          accessibilityRole="button"
        >
          <TrashIcon size={16} color={Colors.red} />
          <Text className="text-sm font-medium text-xporadia-red">Supprimer</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function ChannelDetailScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const id = Number(channelId);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [actionsForMessage, setActionsForMessage] = useState<Message | null>(null);
  const listRef = useRef<FlatList>(null);

  const { data: messages } = useQuery({
    queryKey: ["channel-messages", id],
    queryFn: () => messagingApi.fetchChannelMessages(id),
    enabled: !!id,
    // Le WebSocket (ci-dessous) porte le temps réel — ce polling n'est
    // qu'un filet de sécurité en cas de coupure/reconnexion silencieuse,
    // volontairement espacé pour ne pas doubler le travail du WebSocket.
    refetchInterval: 25000,
  });

  // Même clé de requête que l'écran de liste : React Query réutilise le
  // cache déjà chargé plutôt que de refaire un appel, juste pour peupler
  // l'en-tête (nom et photo du correspondant, ou icône de groupe).
  const { data: channels } = useQuery({ queryKey: ["channels"], queryFn: messagingApi.fetchChannels });
  const channel = channels?.find((c) => c.id === id);
  const [correspondentFirstName, ...correspondentRest] = (channel?.display_name ?? "").split(" ");
  const CHANNEL_HEADER_ICON = { class: UsersIcon, subject: BookIcon, direct: UsersIcon, internship: BriefcaseIcon };

  useChannelSocket(id, {
    onMessageCreated: (message) => {
      queryClient.setQueryData<Message[]>(["channel-messages", id], (current) => {
        if (!current) return current;
        if (current.some((m) => m.id === message.id)) return current;
        return [...current, message];
      });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onMessageUpdated: (message) => {
      queryClient.setQueryData<Message[]>(["channel-messages", id], (current) =>
        current?.map((m) => (m.id === message.id ? message : m)),
      );
    },
    onMessageDeleted: (messageId) => {
      queryClient.setQueryData<Message[]>(["channel-messages", id], (current) =>
        current?.filter((m) => m.id !== messageId),
      );
    },
  });

  useEffect(() => {
    messagingApi.markChannelRead(id).catch(() => {});
  }, [id]);

  const sendMutation = useMutation({
    mutationFn: () => messagingApi.sendMessage(id, { body: body.trim() }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["channel-messages", id] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });

  const editMutation = useMutation({
    mutationFn: () => {
      if (!editingMessage) throw new Error("Aucun message en cours d'édition.");
      return messagingApi.editMessage(editingMessage.id, body.trim());
    },
    onSuccess: () => {
      setBody("");
      setEditingMessage(null);
      queryClient.invalidateQueries({ queryKey: ["channel-messages", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => messagingApi.deleteMessage(messageId),
    onSuccess: () => {
      setActionsForMessage(null);
      queryClient.invalidateQueries({ queryKey: ["channel-messages", id] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });

  const startEditing = (message: Message) => {
    setActionsForMessage(null);
    setEditingMessage(message);
    setBody(message.body);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setBody("");
  };

  const handleSend = () => {
    if (editingMessage) editMutation.mutate();
    else sendMutation.mutate();
  };

  const isPending = sendMutation.isPending || editMutation.isPending;

  const HeaderIcon = channel ? CHANNEL_HEADER_ICON[channel.channel_type] : UsersIcon;

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View className="flex-row items-center gap-2.5">
              {channel?.channel_type === "direct" ? (
                <Avatar firstName={correspondentFirstName} lastName={correspondentRest.join(" ")} imageUri={channel.avatar} size={32} />
              ) : (
                <View className="h-8 w-8 rounded-full bg-white/15 items-center justify-center">
                  <HeaderIcon size={16} color={Colors.white} />
                </View>
              )}
              <Text className="text-white font-semibold text-base" numberOfLines={1}>
                {channel?.display_name ?? "Conversation"}
              </Text>
            </View>
          ),
        }}
      />
      <ChatBackground />

      <FlatList
        ref={listRef}
        data={messages ?? []}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        renderItem={({ item, index }) => {
          const isMine = item.author.id === user?.id;
          const grouped = isGrouped(item, (messages ?? [])[index - 1]);
          return (
            <Pressable
              onLongPress={() => isMine && setActionsForMessage(item)}
              delayLongPress={280}
              className={`flex-row gap-2 ${grouped ? "mt-0.5" : "mt-3"} ${isMine ? "flex-row-reverse" : ""}`}
            >
              {!isMine ? (
                grouped ? (
                  <View style={{ width: 28 }} />
                ) : (
                  <Avatar
                    firstName={item.author.full_name.split(" ")[0]}
                    lastName={item.author.full_name.split(" ").slice(1).join(" ")}
                    imageUri={item.author.avatar}
                    size={28}
                  />
                )
              ) : null}
              <View className={`max-w-[78%] ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && !grouped ? (
                  <Text className="text-[10px] font-semibold text-xporadia-text-secondary mb-1 ml-1">
                    {item.author.full_name}
                  </Text>
                ) : null}
                <View
                  className={`rounded-2xl px-3.5 py-2 ${
                    isMine
                      ? `bg-xporadia-navy ${grouped ? "rounded-br-2xl" : "rounded-br-md"}`
                      : `bg-white shadow-soft ${grouped ? "rounded-bl-2xl" : "rounded-bl-md"}`
                  }`}
                >
                  <Text className={`text-sm leading-5 ${isMine ? "text-white" : "text-xporadia-text-primary"}`}>
                    {item.body}
                  </Text>
                  <View className="flex-row items-center gap-1 self-end mt-0.5">
                    {item.is_edited ? (
                      <Text className={`text-[9px] ${isMine ? "text-white/50" : "text-xporadia-text-secondary"}`}>
                        modifié
                      </Text>
                    ) : null}
                    <Text className={`text-[9px] ${isMine ? "text-white/60" : "text-xporadia-text-secondary"}`}>
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <MessageActionsSheet
        visible={!!actionsForMessage}
        onEdit={() => actionsForMessage && startEditing(actionsForMessage)}
        onDelete={() => actionsForMessage && deleteMutation.mutate(actionsForMessage.id)}
        onClose={() => setActionsForMessage(null)}
      />

      <View className="bg-white border-t border-xporadia-border">
        {editingMessage ? (
          <View className="flex-row items-center justify-between px-4 pt-2.5">
            <View className="flex-row items-center gap-2">
              <PencilIcon size={12} color={Colors.orange} />
              <Text className="text-xs font-medium text-xporadia-orange-text">Modification du message</Text>
            </View>
            <Text className="text-xs text-xporadia-text-secondary" onPress={cancelEditing} suppressHighlighting>
              Annuler
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center gap-3 px-4 py-3">
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Écrire un message..."
            placeholderTextColor="#94A3B8"
            multiline
            className="flex-1 bg-xporadia-bg rounded-2xl px-4 py-3 text-sm text-xporadia-text-primary max-h-24"
          />
          <Pressable
            onPress={handleSend}
            disabled={isPending || body.trim().length === 0}
            className={`h-10 w-10 rounded-full items-center justify-center ${
              body.trim().length === 0 ? "bg-xporadia-border" : "bg-xporadia-orange"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
          >
            <SendIcon size={16} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
