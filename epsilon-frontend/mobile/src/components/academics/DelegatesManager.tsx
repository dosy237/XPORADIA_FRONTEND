import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { TrashIcon, UserPlusIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import type { DelegateBasic } from "@/services/academics";

interface DelegatesManagerProps {
  title: string;
  helperText: string;
  delegates: DelegateBasic[];
  queryKeyToInvalidate: unknown[];
  onAdd: (email: string) => Promise<unknown>;
  onRemove: (email: string) => Promise<unknown>;
}

/** Bloc de gestion des délégués, partagé entre l'écran département
 * (délègue la création de filières) et l'écran filière (délègue la
 * création de classes) — même interaction, même visuel, deux portées
 * différentes selon les callbacks fournis par l'écran parent. */
export function DelegatesManager({
  title,
  helperText,
  delegates,
  queryKeyToInvalidate,
  onAdd,
  onRemove,
}: DelegatesManagerProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const addMutation = useMutation({
    mutationFn: () => onAdd(email.trim().toLowerCase()),
    onSuccess: () => {
      setEmail("");
      setError("");
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
    },
    onError: () => setError("Aucun enseignant actif ne correspond à cet email."),
  });

  const removeMutation = useMutation({
    mutationFn: (delegateEmail: string) => onRemove(delegateEmail),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate }),
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
      <View className="flex-row items-center gap-2">
        <UserPlusIcon size={16} color={Colors.navy} />
        <Text className="text-sm font-bold text-xporadia-navy">{title}</Text>
      </View>
      <Text className="text-xs text-xporadia-text-secondary leading-5">{helperText}</Text>

      {delegates.length > 0 ? (
        <View className="gap-2">
          {delegates.map((delegate) => (
            <View key={delegate.id} className="flex-row items-center gap-2.5 bg-xporadia-bg rounded-xl p-2.5">
              <Avatar firstName={delegate.first_name} lastName={delegate.last_name} size={30} />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-xporadia-text-primary">
                  {delegate.first_name} {delegate.last_name}
                </Text>
                <Text className="text-[11px] text-xporadia-text-secondary">{delegate.email}</Text>
              </View>
              <Pressable
                onPress={() => removeMutation.mutate(delegate.email)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Retirer la délégation de ${delegate.first_name}`}
              >
                <TrashIcon size={15} color={Colors.red} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="email@enseignant.ci"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <Pressable
          onPress={() => email.trim() && addMutation.mutate()}
          disabled={!email.trim() || addMutation.isPending}
          className="h-11 px-4 rounded-xl bg-xporadia-navy items-center justify-center"
        >
          <Text className="text-white text-xs font-semibold">Ajouter</Text>
        </Pressable>
      </View>
      {error ? <Text className="text-xs text-xporadia-red -mt-1">{error}</Text> : null}
    </View>
  );
}
