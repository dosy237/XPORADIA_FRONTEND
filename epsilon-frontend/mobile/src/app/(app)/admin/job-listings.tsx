import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, PencilIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popup } from "@/components/ui/Popup";
import { LEVEL_LABELS, LEVEL_ORDER } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";
import type { ApplicationStatus, ContractType, JobListing, JobStatus } from "@/services/employment";

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Brouillon",
  active: "Active",
  closed: "Clôturée",
  expired: "Expirée",
};

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "En attente",
  viewed: "Vue",
  interview: "Entretien",
  accepted: "Acceptée",
  rejected: "Refusée",
  withdrawn: "Retirée",
};

const CONTRACT_OPTIONS: { value: ContractType; label: string }[] = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "vacation", label: "Vacation" },
  { value: "interim", label: "Intérim" },
];

interface ListingFormValues {
  title: string;
  subject: string;
  city: string;
  commune: string;
  description: string;
  contractType: ContractType;
  certLevel: JobListing["cert_level_required"];
  salaryMin: string;
  salaryMax: string;
}

function formFromListing(listing: JobListing): ListingFormValues {
  return {
    title: listing.title,
    subject: listing.subject,
    city: listing.city,
    commune: listing.commune,
    description: listing.description,
    contractType: listing.contract_type,
    certLevel: listing.cert_level_required,
    salaryMin: listing.salary_min != null ? String(listing.salary_min) : "",
    salaryMax: listing.salary_max != null ? String(listing.salary_max) : "",
  };
}

function ListingFormFields({
  form,
  onChange,
}: {
  form: ListingFormValues;
  onChange: (next: ListingFormValues) => void;
}) {
  return (
    <>
      <Input label="Titre du poste" value={form.title} onChangeText={(v) => onChange({ ...form, title: v })} />
      <Input label="Matière" value={form.subject} onChangeText={(v) => onChange({ ...form, subject: v })} />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input label="Ville" value={form.city} onChangeText={(v) => onChange({ ...form, city: v })} />
        </View>
        <View className="flex-1">
          <Input label="Commune" value={form.commune} onChangeText={(v) => onChange({ ...form, commune: v })} />
        </View>
      </View>
      <Input
        label="Description"
        value={form.description}
        onChangeText={(v) => onChange({ ...form, description: v })}
        multiline
        numberOfLines={3}
      />

      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Type de contrat</Text>
      <View className="flex-row flex-wrap gap-2">
        {CONTRACT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            variant={form.contractType === opt.value ? "navy" : "neutral"}
            onPress={() => onChange({ ...form, contractType: opt.value })}
          />
        ))}
      </View>

      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Niveau de certification requis</Text>
      <View className="flex-row flex-wrap gap-2">
        {LEVEL_ORDER.map((lvl) => (
          <Chip
            key={lvl}
            label={LEVEL_LABELS[lvl]}
            variant={form.certLevel === lvl ? "navy" : "neutral"}
            onPress={() => onChange({ ...form, certLevel: lvl })}
          />
        ))}
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Salaire min (FCFA)"
            value={form.salaryMin}
            onChangeText={(v) => onChange({ ...form, salaryMin: v })}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Input
            label="Salaire max (FCFA)"
            value={form.salaryMax}
            onChangeText={(v) => onChange({ ...form, salaryMax: v })}
            keyboardType="numeric"
          />
        </View>
      </View>
    </>
  );
}

function isFormValid(form: ListingFormValues) {
  return !!(form.title && form.subject && form.city && form.description);
}

function ApplicationsPopup({ listing, onClose }: { listing: JobListing | null; onClose: () => void }) {
  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-listing-applications", listing?.id],
    queryFn: () => employmentApi.fetchListingApplications(listing!.id),
    enabled: !!listing,
  });

  return (
    <Popup visible={!!listing} onClose={onClose}>
      <View className="gap-4">
        <Text className="text-xl font-bold text-xporadia-navy">
          Candidatures {listing ? `· ${listing.title}` : ""}
        </Text>
        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">Chargement...</Text>
        ) : !applications || applications.length === 0 ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">
            Aucune candidature pour l&apos;instant.
          </Text>
        ) : (
          <View className="gap-3">
            {applications.map((application) => (
              <View key={application.id} className="bg-xporadia-bg rounded-xl p-3 gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-xporadia-text-primary">
                    {application.teacher.first_name} {application.teacher.last_name}
                  </Text>
                  <Chip label={APPLICATION_STATUS_LABELS[application.status]} variant="navy-subtle" />
                </View>
                {application.cover_letter ? (
                  <Text className="text-xs text-xporadia-text-secondary" numberOfLines={3}>
                    {application.cover_letter}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>
    </Popup>
  );
}

export default function AdminJobListingsScreen() {
  const queryClient = useQueryClient();
  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-job-listings"],
    queryFn: () => employmentApi.fetchJobListings(),
  });

  const [editingListing, setEditingListing] = useState<JobListing | null>(null);
  const [editForm, setEditForm] = useState<ListingFormValues | null>(null);
  const [viewingApplicationsFor, setViewingApplicationsFor] = useState<JobListing | null>(null);

  const closeMutation = useMutation({
    mutationFn: (id: string) => employmentApi.closeJobListing(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-job-listings"] }),
    onError: () => Alert.alert("Erreur", "Impossible de clôturer cette offre."),
  });

  const editMutation = useMutation({
    mutationFn: () => {
      if (!editingListing || !editForm) throw new Error("no listing");
      return employmentApi.updateJobListing(editingListing.id, {
        title: editForm.title,
        subject: editForm.subject,
        city: editForm.city,
        commune: editForm.commune,
        description: editForm.description,
        contract_type: editForm.contractType,
        cert_level_required: editForm.certLevel,
        salary_min: editForm.salaryMin ? Number(editForm.salaryMin) : null,
        salary_max: editForm.salaryMax ? Number(editForm.salaryMax) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-job-listings"] });
      setEditingListing(null);
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer cette offre."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employmentApi.deleteJobListing(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-job-listings"] }),
    onError: () => Alert.alert("Erreur", "Impossible de supprimer cette offre."),
  });

  const openEdit = (listing: JobListing) => {
    setEditForm(formFromListing(listing));
    setEditingListing(listing);
  };

  const confirmDelete = (listing: JobListing) => {
    Alert.alert(
      "Supprimer cette offre ?",
      `${listing.title} sera définitivement retirée, avec ses candidatures.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate(listing.id) },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Offres d&apos;emploi</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Toutes les offres, tous établissements confondus, y compris les brouillons.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !listings || listings.length === 0 ? (
        <View className="items-center gap-2 py-8">
          <BriefcaseIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucune offre pour l&apos;instant.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {listings.map((listing) => (
            <View key={listing.id} className="bg-white rounded-2xl p-4 shadow-soft gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">
                  {listing.title}
                </Text>
                <Chip label={STATUS_LABELS[listing.status]} variant={listing.status === "active" ? "navy-subtle" : "neutral"} />
              </View>
              <Pressable onPress={() => setViewingApplicationsFor(listing)}>
                <Text className="text-xs text-xporadia-text-secondary">
                  {listing.school.school_name} · {listing.city} ·{" "}
                  <Text className="font-semibold text-xporadia-navy">
                    {listing.application_count} candidature(s)
                  </Text>
                </Text>
              </Pressable>

              <View className="flex-row items-center gap-2 mt-1">
                {listing.status !== "closed" && (
                  <View className="flex-1">
                    <Button
                      label="Clôturer"
                      variant="secondary"
                      pill
                      loading={closeMutation.isPending}
                      onPress={() =>
                        Alert.alert("Clôturer cette offre ?", listing.title, [
                          { text: "Annuler", style: "cancel" },
                          { text: "Clôturer", style: "destructive", onPress: () => closeMutation.mutate(listing.id) },
                        ])
                      }
                    />
                  </View>
                )}
                <View className="flex-1" />
                <Pressable
                  onPress={() => openEdit(listing)}
                  accessibilityRole="button"
                  accessibilityLabel={`Modifier ${listing.title}`}
                  className="h-9 w-9 rounded-full bg-xporadia-bg items-center justify-center"
                >
                  <PencilIcon size={15} color={Colors.navy} />
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(listing)}
                  accessibilityRole="button"
                  accessibilityLabel={`Supprimer ${listing.title}`}
                  className="h-9 w-9 rounded-full bg-xporadia-red/10 items-center justify-center"
                >
                  <TrashIcon size={15} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Popup visible={!!editingListing} onClose={() => setEditingListing(null)}>
        <View className="gap-4">
          <Text className="text-xl font-bold text-xporadia-navy">Modifier l&apos;offre</Text>
          {editForm && <ListingFormFields form={editForm} onChange={setEditForm} />}
          <Button
            label="Enregistrer"
            pill
            disabled={!editForm || !isFormValid(editForm)}
            loading={editMutation.isPending}
            onPress={() => editMutation.mutate()}
          />
        </View>
      </Popup>

      <ApplicationsPopup listing={viewingApplicationsFor} onClose={() => setViewingApplicationsFor(null)} />
    </ScrollView>
  );
}
