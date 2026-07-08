import Svg, { Circle, Path } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

// Petit set d'icônes ligne, cohérent (stroke 2, coins arrondis) — dans
// l'esprit des icônes lit/bath/sqft de la référence Orelax : simples,
// monochromes, jamais décoratives pour elles-mêmes.
export function PinIcon({ size = 16, color = "#5A6A8A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function CoinIcon({ size = 16, color = "#5A6A8A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
      <Path
        d="M12 7v10M9.5 9.5c0-1.1 1.12-2 2.5-2s2.5.9 2.5 2-1.12 2-2.5 2-2.5.9-2.5 2 1.12 2 2.5 2 2.5-.9 2.5-2"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BriefcaseIcon({ size = 16, color = "#5A6A8A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PencilIcon({ size = 16, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m16.5 3.5 4 4L7 21l-4.5 1L3.5 17.5 16.5 3.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BookIcon({ size = 16, color = "#5A6A8A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
