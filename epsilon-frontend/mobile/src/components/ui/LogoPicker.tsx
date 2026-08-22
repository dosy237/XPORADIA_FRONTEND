import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, Text, View } from "react-native";

import { CameraIcon, ImageIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as directorApi from "@/services/directorProfile";

interface LogoPickerProps {
  imageUri?: string | null;
  size?: number;
}

/** Logo de l'établissement, modifiable — tap pour changer ou retirer. Affiché
 * dans l'en-tête du bulletin officiel une fois renseigné (voir
 * apps.grading.pdf côté backend). Contrairement à AvatarPicker, ce composant
 * cible le profil de l'établissement, pas l'utilisateur connecté. */
export function LogoPicker({ imageUri, size = 88 }: LogoPickerProps) {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: directorApi.uploadDirectorLogo,
    onSuccess: (profile) => {
      queryClient.setQueryData(["director-profile"], profile);
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer ce logo."),
  });

  const deleteMutation = useMutation({
    mutationFn: directorApi.deleteDirectorLogo,
    onSuccess: (profile) => {
      queryClient.setQueryData(["director-profile"], profile);
    },
    onError: () => Alert.alert("Erreur", "Impossible de supprimer le logo."),
  });

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    uploadMutation.mutate({ uri: asset.uri, name: asset.fileName ?? "logo.jpg", mimeType: asset.mimeType });
  };

  const openOptions = () => {
    const options: { text: string; style?: "cancel" | "destructive"; onPress?: () => void }[] = [
      { text: "Changer le logo", onPress: pickAndUpload },
    ];
    if (imageUri) {
      options.push({
        text: "Supprimer le logo",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      });
    }
    options.push({ text: "Annuler", style: "cancel" });
    Alert.alert("Logo de l'établissement", "Affiché en en-tête des bulletins officiels", options);
  };

  return (
    <Pressable
      onPress={openOptions}
      accessibilityRole="button"
      accessibilityLabel="Modifier le logo de l'établissement"
      className="relative"
    >
      <View
        className="rounded-2xl border-4 border-white bg-xporadia-bg overflow-hidden items-center justify-center"
        style={{
          width: size,
          height: size,
          shadowColor: "#1E3A5F",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} contentFit="contain" />
        ) : (
          <ImageIcon size={size * 0.32} color={Colors.textSecondary} />
        )}
      </View>
      <View
        className="absolute bottom-0 right-0 bg-xporadia-orange rounded-full items-center justify-center border-2 border-white"
        style={{ width: size * 0.32, height: size * 0.32 }}
      >
        <CameraIcon size={size * 0.16} color={Colors.white} />
      </View>
    </Pressable>
  );
}

/** Petit texte d'aide affiché sous le sélecteur, quand aucun logo n'est encore défini. */
export function LogoPickerHint({ hasLogo }: { hasLogo: boolean }) {
  if (hasLogo) return null;
  return <Text className="text-xs text-xporadia-text-secondary text-center mt-1">Aucun logo</Text>;
}
