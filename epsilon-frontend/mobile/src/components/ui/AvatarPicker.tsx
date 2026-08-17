import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { CameraIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as authApi from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

interface AvatarPickerProps {
  firstName?: string;
  lastName?: string;
  imageUri?: string | null;
  size?: number;
}

/** Avatar de l'utilisateur connecté, modifiable — tap pour changer ou
 * retirer sa photo. Le recadrage se fait via l'éditeur natif du sélecteur
 * (allowsEditing), en carré : c'est le seul format utilisé pour l'avatar
 * partout dans l'app, donc pas besoin d'un outil de recadrage maison. */
export function AvatarPicker({ firstName, lastName, imageUri, size = 96 }: AvatarPickerProps) {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  const uploadMutation = useMutation({
    mutationFn: authApi.uploadMyAvatar,
    onSuccess: (user) => {
      updateUser(user);
      queryClient.invalidateQueries();
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer cette photo."),
  });

  const deleteMutation = useMutation({
    mutationFn: authApi.deleteMyAvatar,
    onSuccess: (user) => {
      updateUser(user);
      queryClient.invalidateQueries();
    },
    onError: () => Alert.alert("Erreur", "Impossible de supprimer la photo."),
  });

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    uploadMutation.mutate({ uri: asset.uri, name: asset.fileName ?? "avatar.jpg", mimeType: asset.mimeType });
  };

  const openOptions = () => {
    const options: { text: string; style?: "cancel" | "destructive"; onPress?: () => void }[] = [
      { text: "Changer la photo", onPress: pickAndUpload },
    ];
    if (imageUri) {
      options.push({
        text: "Supprimer la photo",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      });
    }
    options.push({ text: "Annuler", style: "cancel" });
    Alert.alert("Photo de profil", undefined, options);
  };

  return (
    <Pressable
      onPress={openOptions}
      accessibilityRole="button"
      accessibilityLabel="Modifier la photo de profil"
      className="relative"
    >
      <Avatar firstName={firstName} lastName={lastName} imageUri={imageUri} size={size} />
      <View
        className="absolute bottom-0 right-0 bg-xporadia-orange rounded-full items-center justify-center border-2 border-white"
        style={{ width: size * 0.32, height: size * 0.32 }}
      >
        <CameraIcon size={size * 0.16} color={Colors.white} />
      </View>
    </Pressable>
  );
}
