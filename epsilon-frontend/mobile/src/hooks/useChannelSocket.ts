import { useEffect, useRef } from "react";

import { API_URL } from "@/services/api";
import type { Message } from "@/services/messaging";
import { useAuthStore } from "@/store/authStore";

type RealtimeEvent =
  | { event: "message_created"; message: Message }
  | { event: "message_updated"; message: Message }
  | { event: "message_deleted"; message_id: number };

interface UseChannelSocketOptions {
  onMessageCreated?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (messageId: number) => void;
}

const WS_BASE = API_URL.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");
const MAX_RECONNECT_DELAY_MS = 15000;

/** Connexion temps réel à un canal de messagerie — les écritures passent
 * toujours par l'API REST (services/messaging.ts) ; ce hook ne fait que
 * recevoir les diffusions du serveur et déclencher les callbacks fournis.
 * Reconnexion automatique avec backoff en cas de coupure réseau, cohérent
 * avec un usage terrain en 2G/3G plutôt qu'un environnement fiable. */
export function useChannelSocket(channelId: number | undefined, options: UseChannelSocketOptions) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!channelId || !accessToken) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000;
    let closedByEffectCleanup = false;

    const connect = () => {
      socket = new WebSocket(`${WS_BASE}/ws/messaging/channel/${channelId}/?token=${accessToken}`);

      socket.onopen = () => {
        reconnectDelay = 1000; // connexion réussie -> on réinitialise le backoff
      };

      socket.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          if (data.event === "message_created") optionsRef.current.onMessageCreated?.(data.message);
          else if (data.event === "message_updated") optionsRef.current.onMessageUpdated?.(data.message);
          else if (data.event === "message_deleted") optionsRef.current.onMessageDeleted?.(data.message_id);
        } catch {
          // Message non-JSON ou inattendu — ignoré silencieusement, pas
          // critique pour l'expérience (le polling de secours prend le relai).
        }
      };

      socket.onclose = () => {
        if (closedByEffectCleanup) return;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      closedByEffectCleanup = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [channelId, accessToken]);
}
