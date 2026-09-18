import "@/global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";

import { usePushRegistration } from "@/hooks/usePushRegistration";
import { useAuthStore } from "@/store/authStore";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

function PushRegistration() {
  usePushRegistration();
  return null;
}

// Garde globale : un compte connecté mais jamais vérifié (OTP passé "plus
// tard" à l'inscription) est ramené à l'écran de vérification à chaque
// relance de l'app plutôt que de traîner un accès dégradé partout ailleurs.
// Ne se déclenche qu'UNE FOIS par lancement d'app (premier segment prêt) :
// en réévaluant à chaque changement d'écran, elle renvoyait immédiatement
// l'utilisateur vers verify-otp dès qu'il quittait cet écran (retour
// arrière ou "Vérifier plus tard" inclus), le piégeant sans issue tant que
// le code n'arrivait pas.
function VerificationGate() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isVerified = useAuthStore((s) => s.user?.is_verified);
  const hasCheckedOnLaunch = useRef(false);

  useEffect(() => {
    if (hasCheckedOnLaunch.current || !segments[0]) return;
    hasCheckedOnLaunch.current = true;

    const inAuthGroup = segments[0] === "(auth)";
    if (isAuthenticated && !isVerified && !inAuthGroup) {
      router.replace("/(auth)/verify-otp");
    }
  }, [isAuthenticated, isVerified, segments, router]);

  return null;
}

export default function RootLayout() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated) SplashScreen.hideAsync();
  }, [hasHydrated]);

  if (!hasHydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <PushRegistration />
      <VerificationGate />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
