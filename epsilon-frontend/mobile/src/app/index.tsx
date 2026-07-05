import { Redirect } from "expo-router";

import { useAuthStore } from "@/store/authStore";
import { dashboardPathForRole } from "@/utils/roleRouting";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentRole = useAuthStore((s) => s.currentRole);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Redirect href={dashboardPathForRole(currentRole)} />;
}
