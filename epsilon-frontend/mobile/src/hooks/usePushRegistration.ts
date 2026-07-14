import { useEffect, useRef } from "react";

import * as notificationsApi from "@/services/notifications";
import { registerForPushNotificationsAsync } from "@/services/pushNotifications";
import { useAuthStore } from "@/store/authStore";

// Enregistre le token push Expo de l'appareil dès qu'un utilisateur est
// connecté, et le désenregistre à la déconnexion. Best-effort partout :
// une erreur réseau ou l'absence de projet EAS ne doivent jamais empêcher
// l'utilisateur de se servir de l'application.
export function usePushRegistration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (lastTokenRef.current) {
        notificationsApi.unregisterDeviceToken(lastTokenRef.current).catch(() => {});
        lastTokenRef.current = null;
      }
      return;
    }

    let cancelled = false;
    registerForPushNotificationsAsync().then((result) => {
      if (cancelled || !result) return;
      lastTokenRef.current = result.token;
      notificationsApi.registerDeviceToken(result.token, result.platform).catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}
