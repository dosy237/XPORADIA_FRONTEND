import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MedalIcon, PlusIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { CATEGORY_LABELS, LEVEL_LABELS, LEVEL_ORDER } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as certificationApi from "@/services/certification";
import type { AdminTrainingModule, CertificationLevel, ModuleCategory } from "@/services/certification";

const CATEGORIES: ModuleCategory[] = ["pedagogy", "didactics", "management", "ethics", "leadership"];

function ModuleRow({ module }: { module: AdminTrainingModule }) {
  const queryClient = useQueryClient();
  const toggleMutation = useMutation({
    mutationFn: () => certificationApi.updateAdminModule(module.id, { is_active: !module.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-modules"] }),
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
          {module.title}
        </Text>
        <Chip label={LEVEL_LABELS[module.target_level]} variant="orange" />
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {CATEGORY_LABELS[module.category]} · {module.duration_hours}h · {module.price.toLocaleString("fr-FR")} FCFA · {module.points} pts
      </Text>
      <Pressable onPress={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}>
        <Chip label={module.is_active ? "Actif" : "Désactivé"} variant={module.is_active ? "navy-subtle" : "neutral"} />
      </Pressable>
    </View>
  );
}

export default function AdminCertificationModulesScreen() {
  const queryClient = useQueryClient();
  const { data: modules, isLoading } = useQuery({
    queryKey: ["admin-modules"],
    queryFn: certificationApi.fetchAdminModules,
  });

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ModuleCategory>("pedagogy");
  const [targetLevel, setTargetLevel] = useState<CertificationLevel>("bronze");
  const [durationHours, setDurationHours] = useState("");
  const [price, setPrice] = useState("");
  const [points, setPoints] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      certificationApi.createAdminModule({
        title, description, category, target_level: targetLevel,
        duration_hours: Number(durationHours), price: Number(price), points: Number(points),
        is_active: true, objectives: [], prerequisites: "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      setTitle("");
      setDescription("");
      setDurationHours("");
      setPrice("");
      setPoints("");
      setCreating(false);
    },
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Modules de formation</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Publiés directement dans le catalogue de certification.
        </Text>
      </View>

      {creating ? (
        <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
          <Input label="Titre" value={title} onChangeText={setTitle} />
          <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />

          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Catégorie</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c} label={CATEGORY_LABELS[c]} variant={category === c ? "navy" : "neutral"} onPress={() => setCategory(c)} />
            ))}
          </View>

          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Niveau visé</Text>
          <View className="flex-row gap-2">
            {LEVEL_ORDER.map((lvl) => (
              <Chip key={lvl} label={LEVEL_LABELS[lvl]} variant={targetLevel === lvl ? "navy" : "neutral"} onPress={() => setTargetLevel(lvl)} />
            ))}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input label="Durée (h)" value={durationHours} onChangeText={setDurationHours} keyboardType="numeric" />
            </View>
            <View className="flex-1">
              <Input label="Prix (FCFA)" value={price} onChangeText={setPrice} keyboardType="numeric" />
            </View>
            <View className="flex-1">
              <Input label="Points" value={points} onChangeText={setPoints} keyboardType="numeric" />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setCreating(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Publier"
                pill
                disabled={!title || !description || !durationHours || !price || !points}
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
              />
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setCreating(true)}
          accessibilityRole="button"
          accessibilityLabel="Publier un nouveau module"
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5 shadow-deep-orange"
        >
          <PlusIcon size={16} />
          <Text className="text-white font-semibold">Publier un module</Text>
        </Pressable>
      )}

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !modules || modules.length === 0 ? (
        <View className="items-center gap-2 py-8">
          <MedalIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucun module pour l&apos;instant.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {modules.map((m) => (
            <ModuleRow key={m.id} module={m} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
