import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BellIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { formatRelativeTime as timeAgo } from "@/lib/formatRelativeTime";
import * as notificationsApi from "@/services/notifications";
import type { AppNotification } from "@/services/notifications";

function NotificationRow({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Notification : ${notification.title}`}
      className={`rounded-2xl p-4 border gap-1 flex-row gap-3 ${
        notification.is_read
          ? "bg-white border-xporadia-border"
          : "bg-xporadia-navy/[0.04] border-xporadia-navy/15"
      }`}
    >
      {!notification.is_read && (
        <View className="h-2 w-2 rounded-full bg-xporadia-orange mt-1.5" />
      )}
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-xporadia-text-primary">
          {notification.title}
        </Text>
        <Text className="text-xs text-xporadia-text-secondary leading-5">{notification.body}</Text>
        <Text className="text-[11px] text-xporadia-text-secondary mt-1">
          {timeAgo(notification.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: (updated) => {
      queryClient.setQueryData<AppNotification[] | undefined>(["notifications"], (prev) =>
        prev ? prev.map((n) => (n.id === updated.id ? updated : n)) : prev
      );
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-3">
        <BellIcon color={Colors.textSecondary} size={28} />
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Aucune notification pour l&apos;instant.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-3 pb-12">
      {notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          onPress={() => {
            if (!notification.is_read) markReadMutation.mutate(notification.id);
          }}
        />
      ))}
    </ScrollView>
  );
}
