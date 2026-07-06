import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

// Repli vectoriel du logo Xporadia (mortier + tassel + croisement en X),
// le temps de recevoir le fichier source détouré — voir AuthHeader.tsx.
// Mêmes couleurs que le reste du Design System : navy #1B2A4A / orange #E8510A.
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Line x1="24" y1="36" x2="78" y2="88" stroke="#1B2A4A" strokeWidth={11} strokeLinecap="round" />
      <Line x1="80" y1="34" x2="28" y2="88" stroke="#E8510A" strokeWidth={8} strokeLinecap="round" />
      <Rect x="36" y="30" width="28" height="10" rx="2.5" fill="#1B2A4A" />
      <Path d="M50,7 L86,22 L50,37 L14,22 Z" fill="#1B2A4A" />
      <Line x1="50" y1="20" x2="70" y2="8" stroke="#1B2A4A" strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx="72" cy="7" r="6.5" fill="#E8510A" />
    </Svg>
  );
}
