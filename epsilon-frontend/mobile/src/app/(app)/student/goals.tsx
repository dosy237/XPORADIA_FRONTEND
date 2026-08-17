import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { BriefcaseIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as studentLifeApi from "@/services/studentLife";

function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <View
      className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
        checked ? "bg-xporadia-green border-xporadia-green" : "border-xporadia-border"
      }`}
    >
      {checked ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
    </View>
  );
}

export default function GoalsScreen() {
  const queryClient = useQueryClient();
  const [goalDraft, setGoalDraft] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");

  const { data: goal } = useQuery({ queryKey: ["life-goal"], queryFn: studentLifeApi.fetchLifeGoal });
  const { data: bucketList } = useQuery({ queryKey: ["bucket-list"], queryFn: studentLifeApi.fetchBucketList });

  const saveGoalMutation = useMutation({
    mutationFn: (description: string) => studentLifeApi.updateLifeGoal({ description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-goal"] });
      setGoalDraft(null);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: () => studentLifeApi.createBucketListItem({ title: newItemTitle.trim() }),
    onSuccess: () => {
      setNewItemTitle("");
      queryClient.invalidateQueries({ queryKey: ["bucket-list"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_done }: { id: number; is_done: boolean }) =>
      studentLifeApi.toggleBucketListItem(id, is_done),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bucket-list"] }),
  });

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="p-6 gap-5 pb-12">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-xporadia-navy">Vie & objectifs</Text>
          <Text className="text-sm text-xporadia-text-secondary">
            Ce que vous voulez faire de votre vie, et ce que vous voulez avoir accompli.
          </Text>
        </View>

        <Card className="gap-3">
          <View className="flex-row items-center gap-2">
            <BriefcaseIcon size={16} color={Colors.orange} />
            <Text className="text-sm font-bold text-xporadia-navy">Ce que je veux faire de ma vie</Text>
          </View>
          <TextInput
            value={goalDraft ?? goal?.description ?? ""}
            onChangeText={setGoalDraft}
            placeholder="Ex. Devenir ingénieure logiciel..."
            placeholderTextColor="#94A3B8"
            multiline
            className="text-sm text-xporadia-text-primary min-h-[60px] bg-xporadia-bg rounded-xl p-3"
          />
          {goal?.related_subjects && goal.related_subjects.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {goal.related_subjects.map((s) => (
                <Chip key={s} label={s} variant="navy-subtle" />
              ))}
            </View>
          ) : null}
          {goalDraft !== null && goalDraft !== (goal?.description ?? "") ? (
            <Button
              label="Enregistrer"
              pill
              onPress={() => saveGoalMutation.mutate(goalDraft)}
              loading={saveGoalMutation.isPending}
            />
          ) : null}
        </Card>

        <View className="gap-3">
          <Text className="text-sm font-bold text-xporadia-navy">Ce que je veux avoir accompli</Text>

          <Card className="flex-row items-center gap-2">
            <Input
              value={newItemTitle}
              onChangeText={setNewItemTitle}
              placeholder="Ajouter un objectif..."
              className="flex-1"
            />
            <Button
              label="Ajouter"
              pill
              onPress={() => addItemMutation.mutate()}
              loading={addItemMutation.isPending}
              disabled={newItemTitle.trim().length === 0}
            />
          </Card>

          <View className="gap-2">
            {(bucketList ?? []).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => toggleMutation.mutate({ id: item.id, is_done: !item.is_done })}
                className="bg-white rounded-xl p-4 flex-row items-center gap-3 shadow-soft"
              >
                <CheckCircle checked={item.is_done} />
                <Text
                  className={`flex-1 text-sm ${
                    item.is_done ? "text-xporadia-text-secondary line-through" : "text-xporadia-text-primary font-medium"
                  }`}
                >
                  {item.title}
                </Text>
              </Pressable>
            ))}
            {bucketList && bucketList.length === 0 ? (
              <Text className="text-xs text-xporadia-text-secondary text-center py-6">
                Rien pour l'instant, ajoutez votre premier objectif.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
