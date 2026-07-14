import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";

import { LevelBadge, LevelPath } from "@/components/certification/LevelBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, MedalIcon, PinIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as commentsApi from "@/services/teacherComments";
import * as directoryApi from "@/services/teacherDirectory";
import { useAuthStore } from "@/store/authStore";

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 bg-xporadia-bg rounded-2xl p-3 gap-2 items-center">
      <View className="h-9 w-9 rounded-full bg-white items-center justify-center shadow-card">{icon}</View>
      <Text className="text-sm font-bold text-xporadia-navy" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] text-xporadia-text-secondary">{label}</Text>
    </View>
  );
}

export default function FeedTeacherDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const queryClient = useQueryClient();

  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher-directory-detail", userId],
    queryFn: () => directoryApi.fetchTeacherDirectoryDetail(Number(userId)),
    enabled: !!userId,
  });

  const { data: comments } = useQuery({
    queryKey: ["teacher-comments", userId],
    queryFn: () => commentsApi.fetchTeacherComments(Number(userId)),
    enabled: !!userId,
  });

  const postComment = useMutation({
    mutationFn: () => commentsApi.postTeacherComment(Number(userId), comment, anonymous),
    onSuccess: () => {
      setComment("");
      setAnonymous(false);
      queryClient.invalidateQueries({ queryKey: ["teacher-comments", userId] });
    },
    onError: () => {
      Alert.alert("Erreur", "Votre commentaire n'a pas pu être publié. Réessayez.");
    },
  });

  if (isLoading || !teacher) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="pb-12">
      <View className="items-center pt-10 pb-5 overflow-hidden">
        <View
          className="absolute -top-6 -left-10 h-44 w-44 rounded-full bg-xporadia-navy/[0.05]"
          pointerEvents="none"
        />
        <View
          className="absolute -top-8 -right-12 h-32 w-32 rounded-full bg-xporadia-orange/[0.07]"
          pointerEvents="none"
        />
        <Avatar firstName={teacher.first_name} lastName={teacher.last_name} />
        <Text className="text-xl font-bold text-xporadia-navy mt-3">
          {teacher.first_name} {teacher.last_name}
        </Text>
        <View className="mt-2">
          <Chip label="Enseignant" variant="navy-subtle" />
        </View>
      </View>

      <View className="px-6 gap-5">
        <View className="bg-white rounded-3xl p-6 shadow-deep border border-xporadia-border gap-5">
          <View className="flex-row gap-3">
            <StatBox
              icon={<BriefcaseIcon color={Colors.navy} size={18} />}
              label="Expérience"
              value={`${teacher.experience_years} ans`}
            />
            <StatBox
              icon={<PinIcon color={Colors.navy} size={18} />}
              label="Localisation"
              value={teacher.location || "—"}
            />
            <StatBox
              icon={<MedalIcon color={Colors.navy} size={18} />}
              label="Niveau"
              value={teacher.current_level ? LEVEL_LABELS[teacher.current_level] : "Aucun"}
            />
          </View>

          {teacher.subjects.length > 0 && (
            <View className="gap-2">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                Matières enseignées
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {teacher.subjects.map((subject) => (
                  <Chip key={subject} label={subject} variant="navy-subtle" />
                ))}
              </View>
            </View>
          )}

          {teacher.bio ? (
            <View className="gap-1">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Bio</Text>
              <Text className="text-sm text-xporadia-text-primary leading-5">{teacher.bio}</Text>
            </View>
          ) : null}
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-deep border border-xporadia-border gap-4">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
            Parcours de certification
          </Text>
          <LevelPath current={teacher.current_level} />
        </View>

        {teacher.certifications.length > 0 && (
          <View className="gap-3">
            <Text className="text-base font-bold text-xporadia-navy">
              Modules complétés — découvrir une formation
            </Text>
            {teacher.certifications.map((cert) => (
              <Pressable
                key={cert.id}
                onPress={() =>
                  router.push(
                    `/(tabs)/certifications/${cert.module.id}?from=${encodeURIComponent(
                      `${teacher.first_name} ${teacher.last_name}`
                    )}`
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`Voir le module ${cert.module.title}`}
                className="bg-white rounded-2xl p-4 border border-xporadia-border flex-row items-center gap-3"
              >
                <LevelBadge level={cert.level} size={36} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-xporadia-text-primary">
                    {cert.module.title}
                  </Text>
                  <Text className="text-xs text-xporadia-text-secondary">
                    Score {cert.score_total} · {LEVEL_LABELS[cert.level]}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View className="bg-white rounded-3xl p-5 border border-xporadia-border gap-3">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
            Commentaires{comments && comments.length > 0 ? ` (${comments.length})` : ""}
          </Text>

          {comments && comments.length > 0 ? (
            <View className="gap-3">
              {comments.map((item) => (
                <View key={item.id} className="border-b border-xporadia-border pb-3 gap-1">
                  <Text className="text-sm font-semibold text-xporadia-text-primary">
                    {item.author_name}
                  </Text>
                  <Text className="text-sm text-xporadia-text-secondary leading-5">{item.body}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-xs text-xporadia-text-secondary">Aucun commentaire pour l&apos;instant.</Text>
          )}

          {isAuthenticated ? (
            <>
              <Input
                placeholder="Votre commentaire..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "top" }}
                accessibilityLabel="Votre commentaire"
              />
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-xporadia-text-primary">Publier anonymement</Text>
                <Switch
                  value={anonymous}
                  onValueChange={setAnonymous}
                  trackColor={{ false: Colors.border, true: Colors.navy }}
                  thumbColor={Colors.white}
                  accessibilityLabel="Publier anonymement"
                />
              </View>
              <Button
                label="Publier"
                pill
                disabled={!comment || postComment.isPending}
                onPress={() => postComment.mutate()}
              />
            </>
          ) : (
            <Text className="text-xs text-xporadia-text-secondary">
              Connectez-vous pour laisser un commentaire sur ce profil.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
