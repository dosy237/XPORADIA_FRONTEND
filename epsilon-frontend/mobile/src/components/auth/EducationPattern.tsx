import { Text, View } from "react-native";

// Motif discret en fond du header d'auth — évoque l'éducation (🎓📘✏️),
// à la place du motif floral de la maquette de référence.
const GLYPHS = ["🎓", "📘", "✏️"];
const ROWS = 5;
const COLS = 6;

export function EducationPattern() {
  return (
    <View className="absolute inset-0 flex-row flex-wrap overflow-hidden opacity-10">
      {Array.from({ length: ROWS * COLS }).map((_, i) => (
        <View
          key={i}
          style={{ width: `${100 / COLS}%`, height: `${100 / ROWS}%` }}
          className="items-center justify-center"
        >
          <Text
            style={{ fontSize: 22, transform: [{ rotate: `${(i % 2 === 0 ? -1 : 1) * 12}deg` }] }}
          >
            {GLYPHS[i % GLYPHS.length]}
          </Text>
        </View>
      ))}
    </View>
  );
}
