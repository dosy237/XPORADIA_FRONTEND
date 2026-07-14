import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { DevicePlatform } from "@/services/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface RegisteredPushToken {
  token: string;
  platform: DevicePlatform;
}

// Nécessite un projet EAS associé (`eas init`) pour obtenir un vrai token —
// tant que ce n'est pas fait, getExpoPushTokenAsync échoue proprement et
// cette fonction retourne null sans jamais faire planter l'app. Le push
// réel ne peut de toute façon être vérifié que sur un appareil physique ou
// un build EAS, jamais sur le web ni dans le simulateur.
export async function registerForPushNotificationsAsync(): Promise<RegisteredPushToken | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return { token, platform: Platform.OS as DevicePlatform };
  } catch {
    return null;
  }
}
