import { Circle, Line, Polygon, Svg, Text as SvgText } from "react-native-svg";

export interface RadarAxis {
  label: string;
  value: number;
}

interface SkillsRadarChartProps {
  axes: RadarAxis[];
  max?: number;
  size?: number;
  color?: string;
}

/** Radar de compétences — un axe par matière liée à l'objectif de vie de
 * l'élève, rayon = sa moyenne réelle sur cette matière. Générique (2 à N
 * axes), pas spécifique au dashboard élève, pour rester réutilisable. */
export function SkillsRadarChart({ axes, max = 20, size = 240, color = "#FB5406" }: SkillsRadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 44;
  const angleStep = (Math.PI * 2) / Math.max(axes.length, 1);
  const RING_LEVELS = [0.25, 0.5, 0.75, 1];

  const angleOf = (index: number) => angleStep * index - Math.PI / 2;

  const pointAt = (index: number, ratio: number) => {
    const angle = angleOf(index);
    return { x: center + Math.cos(angle) * radius * ratio, y: center + Math.sin(angle) * radius * ratio };
  };

  const valuePoints = axes.map((axis, i) => pointAt(i, Math.max(0, Math.min(1, axis.value / max))));
  const polygonPoints = valuePoints.map((p) => `${p.x},${p.y}`).join(" ");

  if (axes.length < 3) {
    // Un radar a besoin d'au moins 3 axes pour former une forme lisible —
    // avec moins de matières liées à l'objectif, mieux vaut ne rien
    // afficher qu'un triangle dégénéré trompeur.
    return null;
  }

  return (
    <Svg width={size} height={size}>
      {RING_LEVELS.map((level) => (
        <Polygon
          key={level}
          points={axes.map((_, i) => { const p = pointAt(i, level); return `${p.x},${p.y}`; }).join(" ")}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={1}
        />
      ))}
      {axes.map((_, i) => {
        const p = pointAt(i, 1);
        return <Line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#E2E8F0" strokeWidth={1} />;
      })}
      <Polygon points={polygonPoints} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {valuePoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#FFFFFF" stroke={color} strokeWidth={2.5} />
      ))}
      {axes.map((axis, i) => {
        const angle = angleOf(i);
        const lp = { x: center + Math.cos(angle) * (radius + 26), y: center + Math.sin(angle) * (radius + 26) };
        return (
          <SvgText
            key={`label-${i}`}
            x={lp.x}
            y={lp.y - 4}
            fontSize={11}
            fontWeight="700"
            fill="#0F172A"
            textAnchor="middle"
          >
            {axis.label}
          </SvgText>
        );
      })}
      {axes.map((axis, i) => {
        const angle = angleOf(i);
        const lp = { x: center + Math.cos(angle) * (radius + 26), y: center + Math.sin(angle) * (radius + 26) };
        return (
          <SvgText
            key={`value-${i}`}
            x={lp.x}
            y={lp.y + 10}
            fontSize={10}
            fontWeight="600"
            fill="#5A6A8A"
            textAnchor="middle"
          >
            {`${axis.value.toFixed(1)}/${max}`}
          </SvgText>
        );
      })}
    </Svg>
  );
}
