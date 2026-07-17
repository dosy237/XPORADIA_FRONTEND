import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import type { DevicePlatform } from "@/services/notifications";

// Depuis le SDK 53, les notifications push distantes ont été entièrement
// retirées d'Expo Go (natif requis) — voir
// https://docs.expo.dev/develop/development-builds/introduction/. Le module
// expo-notifications lève une erreur dès qu'on l'utilise dans ce contexte
// (y compris setNotificationHandler), donc on évite tout appel — et même
// tout require du module — tant qu'on tourne dans Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export interface RegisteredPushToken {
  token: string;
  platform: DevicePlatform;
}

// Nécessite un projet EAS associé (`eas init`) pour obtenir un vrai token —
// tant que ce n'est pas fait, getExpoPushTokenAsync échoue proprement et
// cette fonction retourne null sans jamais faire planter l'app. Le push
// réel ne peut de toute façon être vérifié que sur un appareil physique ou
// un build EAS, jamais sur le web, dans le simulateur, ni dans Expo Go.
export async function registerForPushNotificationsAsync(): Promise<RegisteredPushToken | null> {
  if (Platform.OS === "web") return null;
  if (isExpoGo) return null;
  if (!Device.isDevice) return null;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require("expo-notifications");

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
