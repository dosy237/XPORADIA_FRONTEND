import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { Colors } from "@/constants/theme";
import { authHeaders } from "@/utils/pdf";

/** Ouvre un PDF hébergé chez nous directement dans l'application — jamais
 * un renvoi vers le navigateur du téléphone. `WebView` a été choisi
 * plutôt qu'une librairie de lecture PDF dédiée (ex. react-native-pdf) :
 * elle est officiellement supportée par Expo Go, et les moteurs de rendu
 * WebView natifs d'iOS et Android affichent déjà un PDF nativement dès
 * qu'on lui donne une URL distante, sans dépendance supplémentaire.
 *
 * `authenticated=1` (voir viewPdf dans @/utils/pdf) fait passer le jeton
 * d'authentification via `source.headers`, supporté nativement par
 * react-native-webview pour une requête GET — la WebView charge alors
 * l'URL distante elle-même, comme le ferait un navigateur. Un fichier
 * TÉLÉCHARGÉ localement (file:// ou content:// après conversion) a été
 * essayé en premier mais reste refusé par la WebView Android avec
 * ERR_ACCESS_DENIED (restriction sur les fichiers privés de l'app même
 * via FileProvider) — constaté en conditions réelles, d'où cette
 * approche par en-tête plutôt que par fichier local.
 *
 * `react-native-webview` ne fonctionne qu'sur iOS/Android : sur le web,
 * son composant ne rend rien (aucune iframe, aucun événement de
 * chargement). On y bascule donc sur une `<iframe>` HTML classique, qui
 * reste tout autant "dans l'application" (même onglet, même route) qu'un
 * renvoi externe serait exclu — mais qui ne peut pas fixer d'en-tête HTTP,
 * d'où le detour par blob: (fetchToLocalUri) fait en amont pour le web
 * uniquement. */
export default function PdfViewerScreen() {
  const { url, title, authenticated } = useLocalSearchParams<{
    url: string;
    title?: string;
    authenticated?: string;
  }>();
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
          source={authenticated === "1" ? { uri: decodedUrl, headers: authHeaders() } : { uri: decodedUrl }}
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
