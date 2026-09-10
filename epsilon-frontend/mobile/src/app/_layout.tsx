import "@/global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

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
// relance de l'app plutôt que de traîner un accès dégradé partout ailleurs
//, sauf s'il navigue déjà dans le flow (auth), pour ne pas casser l'écran
// verify-otp lui-même ou un retour volontaire vers login/register.
function VerificationGate() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isVerified = useAuthStore((s) => s.user?.is_verified);

  useEffect(() => {
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
