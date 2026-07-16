import { ReactNode } from "react";
import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";

interface DashboardPlaceholderProps {
  title: string;
  upcomingFeatures?: string[];
  children?: ReactNode;
}

export function DashboardPlaceholder({ title, upcomingFeatures = [], children }: DashboardPlaceholderProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <View className="flex-1 bg-xporadia-bg p-6 gap-4">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">
          Bonjour {user?.first_name} 👋
        </Text>
        <Text className="text-xporadia-text-secondary">{title}</Text>
      </View>

      {!user?.is_verified && (
        <Card className="border-xporadia-gold bg-xporadia-gold/10">
          <Text className="text-xporadia-text-primary">
            Votre compte n&apos;est pas encore vérifié. Consultez votre email pour le code de
            vérification.
          </Text>
        </Card>
      )}

      {children}

      {upcomingFeatures.length > 0 && (
        <Card className="gap-2">
          <Text className="font-semibold text-xporadia-text-primary">À venir sur ce tableau de bord</Text>
          {upcomingFeatures.map((feature) => (
            <Text key={feature} className="text-xporadia-text-secondary">
              • {feature}
            </Text>
          ))}
        </Card>
      )}
    </View>
  );
}
