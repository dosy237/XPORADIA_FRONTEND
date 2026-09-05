import { Platform } from "react-native";

export interface LocalFileAsset {
  uri: string;
  name: string;
  mimeType?: string | null;
}

/** Ajoute un fichier choisi côté appareil à un FormData, de façon
 * compatible web ET natif.
 *
 * Sur React Native, `FormData.append(key, {uri, name, type})` est un
 * format spécial reconnu nativement par la couche réseau. Sur le web,
 * `FormData` est celui du navigateur : ce même objet est simplement
 * sérialisé en texte ("La donnée soumise n'est pas un fichier" côté
 * Django), jamais transféré comme fichier réel. Il faut donc résoudre
 * l'URI (généralement un `blob:` local sur web) en un vrai Blob/File
 * avant de l'ajouter. */
export async function appendFileAsset(formData: FormData, key: string, asset: LocalFileAsset) {
  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const file = new File([blob], asset.name, { type: asset.mimeType || blob.type || "application/octet-stream" });
    formData.append(key, file);
    return;
  }
  formData.append(key, {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || "application/octet-stream",
  } as unknown as Blob);
}
