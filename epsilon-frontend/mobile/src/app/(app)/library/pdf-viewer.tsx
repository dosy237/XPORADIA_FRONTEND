import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { Colors } from "@/constants/theme";

/** Ouvre un PDF hébergé chez nous directement dans l'application — jamais
 * un renvoi vers le navigateur du téléphone. `WebView` a été choisi
 * plutôt qu'une librairie de lecture PDF dédiée (ex. react-native-pdf) :
 * elle est officiellement supportée par Expo Go (aucune reconstruction
 * native du projet nécessaire, contrairement à un module natif tiers), et
 * les moteurs de rendu WebView natifs d'iOS et Android affichent déjà un
 * PDF nativement dès qu'on lui donne l'URL, sans dépendance supplémentaire.
 * `source={{ uri }}` fonctionne aussi bien pour un flux distant (le cas
 * d'aujourd'hui) qu'un fichier local `file://` déjà téléchargé (le cas de
 * la consultation hors-ligne, prévue plus tard) — donc rien n'empêche
 * cet usage futur.
 *
 * `react-native-webview` ne fonctionne qu'sur iOS/Android : sur le web,
 * son composant ne rend rien (aucune iframe, aucun événement de
 * chargement). On y bascule donc sur une `<iframe>` HTML classique, qui
 * reste tout autant "dans l'application" (même onglet, même route) qu'un
 * renvoi externe serait exclu. */
export default function PdfViewerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const [loading, setLoading] = useState(true);
  const decodedUrl = url ? decodeURIComponent(url) : "";

  return (
    <View className="flex-1 bg-xporadia-navy">
      <Stack.Screen options={{ title: title ? decodeURIComponent(title) : "Document" }} />
      {decodedUrl && Platform.OS === "web" ? (
        // eslint-disable-next-line react/no-unknown-property
        <iframe
          src={decodedUrl}
          title={title ? decodeURIComponent(title) : "Document"}
          onLoad={() => setLoading(false)}
          style={{ flex: 1, border: "none", backgroundColor: Colors.navy }}
        />
      ) : decodedUrl ? (
        <WebView
          source={{ uri: decodedUrl }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={false}
          style={{ flex: 1, backgroundColor: Colors.navy }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/70 text-sm">Aucun document à afficher.</Text>
        </View>
      )}
      {loading ? (
        <View className="absolute inset-0 items-center justify-center bg-xporadia-navy" pointerEvents="none">
          <ActivityIndicator color={Colors.orange} />
        </View>
      ) : null}
    </View>
  );
}
