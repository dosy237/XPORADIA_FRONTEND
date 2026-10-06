import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MedalIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popup } from "@/components/ui/Popup";
import { CATEGORY_LABELS, LEVEL_LABELS, LEVEL_ORDER } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as certificationApi from "@/services/certification";
import type { AdminTrainingModule, CertificationLevel, ModuleCategory } from "@/services/certification";

const CATEGORIES: ModuleCategory[] = ["pedagogy", "didactics", "management", "ethics", "leadership"];

interface ModuleFormValues {
  title: string;
  description: string;
  category: ModuleCategory;
  targetLevel: CertificationLevel;
  durationHours: string;
  price: string;
  points: string;
  coverImage: ImagePicker.ImagePickerAsset | null;
}

function emptyForm(): ModuleFormValues {
  return {
    title: "",
    description: "",
    category: "pedagogy",
    targetLevel: "bronze",
    durationHours: "",
    price: "",
    points: "",
    coverImage: null,
  };
}

function formFromModule(module: AdminTrainingModule): ModuleFormValues {
  return {
    title: module.title,
    description: module.description,
    category: module.category,
    targetLevel: module.target_level,
    durationHours: String(module.duration_hours),
    price: String(module.price),
    points: String(module.points),
    coverImage: null,
  };
}

function ModuleFormFields({
  form,
  onChange,
  existingCoverImage,
}: {
  form: ModuleFormValues;
  onChange: (next: ModuleFormValues) => void;
  existingCoverImage?: string | null;
}) {
  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) onChange({ ...form, coverImage: result.assets[0] });
  };

  const previewUri = form.coverImage?.uri ?? existingCoverImage ?? null;

  return (
    <>
      <Input label="Titre" value={form.title} onChangeText={(v) => onChange({ ...form, title: v })} />
      <Input
        label="Description"
        value={form.description}
        onChangeText={(v) => onChange({ ...form, description: v })}
        multiline
        numberOfLines={3}
      />

      <Pressable onPress={pickCoverImage} accessibilityRole="button" accessibilityLabel="Choisir une image de couverture">
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={{ width: "100%", height: 120, borderRadius: 12 }} contentFit="cover" />
        ) : (
          <View className="flex-row items-center justify-center gap-2 border border-xporadia-border rounded-xl py-3.5">
            <PlusIcon size={14} color={Colors.navy} />
            <Text className="text-xs font-semibold text-xporadia-navy">Image de couverture (optionnel)</Text>
          </View>
        )}
      </Pressable>

      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Catégorie</Text>
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={CATEGORY_LABELS[c]}
            variant={form.category === c ? "navy" : "neutral"}
            onPress={() => onChange({ ...form, category: c })}
          />
        ))}
      </View>

      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Niveau visé</Text>
      <View className="flex-row flex-wrap gap-2">
        {/* "Zéro" est le palier de départ, jamais un niveau qu'un module peut faire atteindre. */}
        {LEVEL_ORDER.filter((lvl) => lvl !== "zero").map((lvl) => (
          <Chip
            key={lvl}
            label={LEVEL_LABELS[lvl]}
            variant={form.targetLevel === lvl ? "navy" : "neutral"}
            onPress={() => onChange({ ...form, targetLevel: lvl })}
          />
        ))}
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Durée (h)"
            value={form.durationHours}
            onChangeText={(v) => onChange({ ...form, durationHours: v })}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Input label="Prix (FCFA)" value={form.price} onChangeText={(v) => onChange({ ...form, price: v })} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <Input label="Points" value={form.points} onChangeText={(v) => onChange({ ...form, points: v })} keyboardType="numeric" />
        </View>
      </View>
    </>
  );
}

function isFormValid(form: ModuleFormValues) {
  return !!(form.title && form.description && form.durationHours && form.price && form.points);
}

function ModuleRow({
  module,
  onEdit,
}: {
  module: AdminTrainingModule;
  onEdit: (module: AdminTrainingModule) => void;
}) {
  const queryClient = useQueryClient();
  const toggleMutation = useMutation({
    mutationFn: () => certificationApi.updateAdminModule(module.id, { is_active: !module.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-modules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => certificationApi.deleteAdminModule(module.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-modules"] }),
    onError: () => Alert.alert("Erreur", "Impossible de supprimer ce module."),
  });

  const confirmDelete = () => {
    Alert.alert(
      "Supprimer ce module ?",
      `${module.title} sera définitivement retiré du catalogue.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      {module.cover_image ? (
        <Image source={{ uri: module.cover_image }} style={{ width: "100%", height: 120, borderRadius: 12 }} contentFit="cover" />
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">
          {module.title}
        </Text>
        <Chip label={LEVEL_LABELS[module.target_level]} variant="orange" />
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {`${CATEGORY_LABELS[module.category]} · ${module.duration_hours}h · ${module.price.toLocaleString("fr-FR")} FCFA · ${module.points} pts`}
      </Text>
      <View className="flex-row items-center gap-2">
        <Pressable onPress={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}>
          <Chip label={module.is_active ? "Actif" : "Désactivé"} variant={module.is_active ? "navy-subtle" : "neutral"} />
        </Pressable>
        <View className="flex-1" />
        <Pressable
          onPress={() => onEdit(module)}
          accessibilityRole="button"
          accessibilityLabel={`Modifier ${module.title}`}
          className="h-9 w-9 rounded-full bg-xporadia-bg items-center justify-center"
        >
          <PencilIcon size={15} color={Colors.navy} />
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer ${module.title}`}
          className="h-9 w-9 rounded-full bg-xporadia-red/10 items-center justify-center"
        >
          <TrashIcon size={15} />
        </Pressable>
      </View>
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
  const [createForm, setCreateForm] = useState<ModuleFormValues>(emptyForm());

  const [editingModule, setEditingModule] = useState<AdminTrainingModule | null>(null);
  const [editForm, setEditForm] = useState<ModuleFormValues>(emptyForm());

  const createMutation = useMutation({
    mutationFn: async () => {
      const created = await certificationApi.createAdminModule({
        title: createForm.title,
        description: createForm.description,
        category: createForm.category,
        target_level: createForm.targetLevel,
        duration_hours: Number(createForm.durationHours),
        price: Number(createForm.price),
        points: Number(createForm.points),
        is_active: true,
        objectives: [],
        prerequisites: "",
      });
      if (createForm.coverImage) {
        await certificationApi.uploadAdminModuleCoverImage(created.id, {
          uri: createForm.coverImage.uri,
          name: createForm.coverImage.fileName ?? "cover.jpg",
          mimeType: createForm.coverImage.mimeType,
        });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      setCreateForm(emptyForm());
      setCreating(false);
    },
    onError: () => Alert.alert("Erreur", "Impossible de publier ce module."),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editingModule) return;
      await certificationApi.updateAdminModule(editingModule.id, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        target_level: editForm.targetLevel,
        duration_hours: Number(editForm.durationHours),
        price: Number(editForm.price),
        points: Number(editForm.points),
      });
      if (editForm.coverImage) {
        await certificationApi.uploadAdminModuleCoverImage(editingModule.id, {
          uri: editForm.coverImage.uri,
          name: editForm.coverImage.fileName ?? "cover.jpg",
          mimeType: editForm.coverImage.mimeType,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      setEditingModule(null);
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer ce module."),
  });

  const openEdit = (module: AdminTrainingModule) => {
    setEditForm(formFromModule(module));
    setEditingModule(module);
  };

  return (
    <View className="flex-1 bg-xporadia-bg">
      <ScrollView contentContainerClassName="p-6 gap-4 pb-24">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-xporadia-navy">Modules de formation</Text>
          <Text className="text-sm text-xporadia-text-secondary">
            Publiés directement dans le catalogue de certification.
          </Text>
        </View>

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
              <ModuleRow key={m.id} module={m} onEdit={openEdit} />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => {
          setCreateForm(emptyForm());
          setCreating(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Publier un nouveau module"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-xporadia-orange items-center justify-center shadow-deep-orange"
      >
        <PlusIcon size={22} />
      </Pressable>

      <Popup visible={creating} onClose={() => setCreating(false)}>
        <View className="gap-4">
          <Text className="text-xl font-bold text-xporadia-navy">Publier un module</Text>
          <ModuleFormFields form={createForm} onChange={setCreateForm} />
          <Button
            label="Publier"
            pill
            disabled={!isFormValid(createForm)}
            loading={createMutation.isPending}
            onPress={() => createMutation.mutate()}
          />
        </View>
      </Popup>

      <Popup visible={!!editingModule} onClose={() => setEditingModule(null)}>
        <View className="gap-4">
          <Text className="text-xl font-bold text-xporadia-navy">Modifier le module</Text>
          <ModuleFormFields form={editForm} onChange={setEditForm} existingCoverImage={editingModule?.cover_image} />
          <Button
            label="Enregistrer"
            pill
            disabled={!isFormValid(editForm)}
            loading={editMutation.isPending}
            onPress={() => editMutation.mutate()}
          />
        </View>
      </Popup>
    </View>
  );
}
