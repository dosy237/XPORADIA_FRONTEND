import { useEffect, useRef } from "react";

import { API_URL } from "@/services/api";
import type { Post, PostComment } from "@/services/feed";

type FeedRealtimeEvent =
  | { event: "post_created"; post: Post }
  | { event: "post_deleted"; post_id: number }
  | { event: "post_like_updated"; post_id: number; like_count: number }
  | { event: "post_comment_count_updated"; post_id: number; comment_count: number }
  | { event: "comment_created"; comment: PostComment }
  | { event: "comment_deleted"; comment_id: number };

interface UseFeedSocketOptions {
  onPostCreated?: (post: Post) => void;
  onPostDeleted?: (postId: number) => void;
  onLikeUpdated?: (postId: number, likeCount: number) => void;
  onCommentCountUpdated?: (postId: number, commentCount: number) => void;
  onCommentCreated?: (comment: PostComment) => void;
  onCommentDeleted?: (commentId: number) => void;
}

const WS_BASE = API_URL.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");
const MAX_RECONNECT_DELAY_MS = 15000;

/** Connexion temps réel au fil d'actualité — sans `postId`, se branche sur
 * le fil global (nouvelles publications, likes) ; avec un `postId`, se
 * branche en plus sur cette publication précise (commentaires en direct
 * sur l'écran détail). Lecture seule, publique : fonctionne même sans
 * compte connecté, cohérent avec la lecture du fil elle-même. */
export function useFeedSocket(postId: number | undefined, options: UseFeedSocketOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000;
    let closedByEffectCleanup = false;

    const url = postId ? `${WS_BASE}/ws/feed/post/${postId}/` : `${WS_BASE}/ws/feed/`;

    const connect = () => {
      socket = new WebSocket(url);

      socket.onopen = () => {
        reconnectDelay = 1000;
      };

      socket.onmessage = (event) => {
        try {
          const data: FeedRealtimeEvent = JSON.parse(event.data);
          if (data.event === "post_created") optionsRef.current.onPostCreated?.(data.post);
          else if (data.event === "post_deleted") optionsRef.current.onPostDeleted?.(data.post_id);
          else if (data.event === "post_like_updated") optionsRef.current.onLikeUpdated?.(data.post_id, data.like_count);
          else if (data.event === "post_comment_count_updated")
            optionsRef.current.onCommentCountUpdated?.(data.post_id, data.comment_count);
          else if (data.event === "comment_created") optionsRef.current.onCommentCreated?.(data.comment);
          else if (data.event === "comment_deleted") optionsRef.current.onCommentDeleted?.(data.comment_id);
        } catch {
          // Ignoré — le polling de secours prend le relai si besoin.
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
  }, [postId]);
}
