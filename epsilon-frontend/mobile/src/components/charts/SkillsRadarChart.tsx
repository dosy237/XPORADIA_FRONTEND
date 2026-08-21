import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Circle, Defs, Path, Polygon, RadialGradient, Stop, Svg, Text as SvgText } from "react-native-svg";

import { smoothClosedPath } from "@/components/charts/smoothPath";

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

const AnimatedView = Animated.View;

/** Radar de compétences — un axe par matière liée à l'objectif de vie de
 * l'élève, rayon = sa moyenne réelle sur cette matière. Générique (2 à N
 * axes), pas spécifique au dashboard élève, pour rester réutilisable.
 * Contour lissé (Catmull-Rom) plutôt qu'un polygone à angles durs, remplissage
 * en dégradé radial, "éclosion" animée à l'affichage, et un sommet qu'on
 * peut toucher pour voir sa valeur en détail. */
export function SkillsRadarChart({ axes, max = 20, size = 240, color = "#FB5406" }: SkillsRadarChartProps) {
  // Marge horizontale ajoutée de part et d'autre du cercle : les libellés
  // des axes latéraux (ex. "Physique-Chimie") dépassent le rayon du
  // cercle et étaient rognés quand la toile SVG faisait exactement `size`
  // de large. Le cercle reste centré (même `center`/`radius`), seule la
  // toile s'élargit pour laisser respirer le texte.
  const LABEL_H_PAD = 42;
  const canvasWidth = size + LABEL_H_PAD * 2;
  const center = size / 2;
  const offsetX = LABEL_H_PAD;
  const radius = size / 2 - 44;
  const angleStep = (Math.PI * 2) / Math.max(axes.length, 1);
  const RING_LEVELS = [0.25, 0.5, 0.75, 1];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const bloom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bloom.setValue(0);
    Animated.timing(bloom, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.back(1.15)),
      useNativeDriver: true,
    }).start();
  }, [axes.length, bloom]);

  const angleOf = (index: number) => angleStep * index - Math.PI / 2;

  const pointAt = (index: number, ratio: number) => {
    const angle = angleOf(index);
    return { x: offsetX + center + Math.cos(angle) * radius * ratio, y: center + Math.sin(angle) * radius * ratio };
  };

  if (axes.length < 3) {
    // Un radar a besoin d'au moins 3 axes pour former une forme lisible —
    // avec moins de matières liées à l'objectif, mieux vaut ne rien
    // afficher qu'un triangle dégénéré trompeur.
    return null;
  }

  const valuePoints = axes.map((axis, i) => pointAt(i, Math.max(0, Math.min(1, axis.value / max))));
  const valuePath = smoothClosedPath(valuePoints);
  const active = activeIndex != null ? axes[activeIndex] : null;
  const activePoint = activeIndex != null ? valuePoints[activeIndex] : null;

  return (
    <View style={{ width: canvasWidth, height: size }}>
      <AnimatedView
        style={{
          width: canvasWidth,
          height: size,
          opacity: bloom,
          transform: [{ scale: bloom.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }],
        }}
      >
        <Svg width={canvasWidth} height={size}>
          <Defs>
            <RadialGradient id="radarFill" cx="50%" cy="50%" r="55%">
              <Stop offset="0" stopColor={color} stopOpacity={0.4} />
              <Stop offset="1" stopColor={color} stopOpacity={0.1} />
            </RadialGradient>
          </Defs>
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
            return <Path key={i} d={`M ${offsetX + center} ${center} L ${p.x} ${p.y}`} stroke="#E2E8F0" strokeWidth={1} />;
          })}
          <Path d={valuePath} fill="url(#radarFill)" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
          {valuePoints.map((p, i) => {
            const isActive = activeIndex === i;
            return (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isActive ? 7.5 : 4}
                fill="#FFFFFF"
                stroke={color}
                strokeWidth={isActive ? 3 : 2.5}
              />
            );
          })}
          {axes.map((axis, i) => {
            const angle = angleOf(i);
            const lp = { x: offsetX + center + Math.cos(angle) * (radius + 26), y: center + Math.sin(angle) * (radius + 26) };
            return (
              <SvgText key={`label-${i}`} x={lp.x} y={lp.y - 4} fontSize={11} fontWeight="700" fill="#0F172A" textAnchor="middle">
                {axis.label}
              </SvgText>
            );
          })}
          {axes.map((axis, i) => {
            const angle = angleOf(i);
            const lp = { x: offsetX + center + Math.cos(angle) * (radius + 26), y: center + Math.sin(angle) * (radius + 26) };
            return (
              <SvgText key={`value-${i}`} x={lp.x} y={lp.y + 10} fontSize={10} fontWeight="600" fill="#5A6A8A" textAnchor="middle">
                {`${axis.value.toFixed(1)}/${max}`}
              </SvgText>
            );
          })}
        </Svg>
      </AnimatedView>

      {/* Zones tactiles réelles, en superposition — un `onPress` posé
          directement sur une forme SVG n'est pas fiable sur toutes les
          cibles (avertissements DOM observés sur le rendu web) ; un
          `Pressable` RN classique par-dessus, aux mêmes coordonnées, est
          le pattern déjà éprouvé ailleurs dans l'app. */}
      {valuePoints.map((p, i) => (
        <Pressable
          key={i}
          onPress={() => setActiveIndex((current) => (current === i ? null : i))}
          accessibilityRole="button"
          accessibilityLabel={`${axes[i].label} : ${axes[i].value.toFixed(1)}/${max}`}
          hitSlop={10}
          style={{ position: "absolute", left: p.x - 14, top: p.y - 14, width: 28, height: 28, borderRadius: 14 }}
        />
      ))}

      {active && activePoint ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: Math.max(4, Math.min(canvasWidth - 116, activePoint.x - 58)),
            top: Math.max(0, activePoint.y - 48),
            width: 116,
            alignItems: "center",
            backgroundColor: "#0F172A",
            borderRadius: 12,
            paddingVertical: 6,
            paddingHorizontal: 10,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }} numberOfLines={1}>
            {active.label}
          </Text>
          <Text style={{ color: "#FFB088", fontSize: 12, fontWeight: "800" }}>
            {`${active.value.toFixed(1)}/${max}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
