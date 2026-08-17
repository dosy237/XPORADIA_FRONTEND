import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { PlusIcon } from "@/components/ui/Icon";
import * as employmentApi from "@/services/employment";
import type { ContractType, JobListing } from "@/services/employment";

const STATUS_LABELS: Record<JobListing["status"], string> = {
  draft: "Brouillon",
  active: "Active",
  closed: "Clôturée",
  expired: "Expirée",
};

const CONTRACT_OPTIONS: { value: ContractType; label: string }[] = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "vacation", label: "Vacation" },
  { value: "interim", label: "Intérim" },
];

function ListingCard({
  listing,
  onPublish,
  onClose,
}: {
  listing: JobListing;
  onPublish: (id: string) => void;
  onClose: (id: string) => void;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(app)/director/job-listings/[listingId]",
            params: { listingId: listing.id, title: listing.title },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Voir les candidatures pour ${listing.title}`}
        className="gap-2"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-xporadia-text-primary flex-1">
            {listing.title}
          </Text>
          <Chip label={STATUS_LABELS[listing.status]} variant="navy-subtle" />
        </View>
        <Text className="text-xs text-xporadia-text-secondary">
          {listing.subject} · {listing.city} · {listing.application_count} candidature
          {listing.application_count !== 1 ? "s" : ""}
        </Text>
      </Pressable>

      {listing.status === "draft" && (
        <Button label="Publier" pill onPress={() => onPublish(listing.id)} />
      )}
      {listing.status === "active" && (
        <Button label="Clôturer" variant="secondary" pill onPress={() => onClose(listing.id)} />
      )}
    </View>
  );
}

export default function DirectorJobListingsScreen() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [contractType, setContractType] = useState<ContractType>("cdi");
  const [targetedEmails, setTargetedEmails] = useState("");

  const queryKey = ["my-job-listings"];
  const { data: listings, isLoading } = useQuery({
    queryKey,
    queryFn: () => employmentApi.fetchJobListings(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      employmentApi.createJobListing({
        title,
        subject,
        city,
        description,
        contract_type: contractType,
        targeted_teacher_emails: targetedEmails
          ? targetedEmails.split(",").map((e) => e.trim()).filter(Boolean)
          : undefined,
      }),
    onSuccess: (listing) => {
      queryClient.setQueryData<JobListing[] | undefined>(queryKey, (prev) =>
        prev ? [listing, ...prev] : [listing]
      );
      setTitle("");
      setSubject("");
      setCity("");
      setDescription("");
      setTargetedEmails("");
      setAdding(false);
    },
  });

  const updateCache = (listing: JobListing) => {
    queryClient.setQueryData<JobListing[] | undefined>(queryKey, (prev) =>
      prev ? prev.map((l) => (l.id === listing.id ? listing : l)) : prev
    );
  };

  const publishMutation = useMutation({
    mutationFn: (id: string) => employmentApi.publishJobListing(id),
    onSuccess: updateCache,
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => employmentApi.closeJobListing(id),
    onSuccess: updateCache,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Vos offres d&apos;emploi. Une offre créée reste en brouillon jusqu&apos;à publication.
      </Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (listings ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune offre pour l&apos;instant.
        </Text>
      ) : (
        (listings ?? []).map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onPublish={(id) => publishMutation.mutate(id)}
            onClose={(id) => closeMutation.mutate(id)}
          />
        ))
      )}

      {adding ? (
        <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
          <Input label="Titre du poste" value={title} onChangeText={setTitle} placeholder="Professeur de Maths" />
          <Input label="Matière" value={subject} onChangeText={setSubject} placeholder="Mathématiques" />
          <Input label="Ville" value={city} onChangeText={setCity} placeholder="Abidjan" />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top" }}
          />

          <Text className="text-sm font-medium text-xporadia-text-secondary">Type de contrat</Text>
          <View className="flex-row flex-wrap gap-2">
            {CONTRACT_OPTIONS.map((opt) => (
              <Pressable key={opt.value} onPress={() => setContractType(opt.value)}>
                <Chip label={opt.label} variant={contractType === opt.value ? "navy" : "navy-subtle"} />
              </Pressable>
            ))}
          </View>

          <Input
            label="Cibler des profils « open to work » (emails, optionnel)"
            value={targetedEmails}
            onChangeText={setTargetedEmails}
            placeholder="prof1@exemple.ci, prof2@exemple.ci"
            autoCapitalize="none"
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Créer"
                pill
                disabled={!title || !subject || !city || !description}
                loading={createMutation.isPending}
                onPress={() => createMutation.mutate()}
              />
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          accessibilityLabel="Publier une offre d'emploi"
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5"
        >
          <PlusIcon size={16} />
          <Text className="text-white font-semibold">Publier une offre</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
