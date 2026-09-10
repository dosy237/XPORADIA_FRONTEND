import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Circle, Defs, Line, LinearGradient, Path, Stop, Svg, Text as SvgText } from "react-native-svg";

import { smoothOpenPath } from "@/components/charts/smoothPath";

export interface TrendPoint {
  label: string;
  value: number;
}

interface GradeTrendChartProps {
  points: TrendPoint[];
  /** Série de comparaison (ex. moyenne de classe par trimestre) — un repère
   * discret qu'on découvre, jamais un jugement affiché frontalement : pas
   * de points ni de valeurs chiffrées, juste un pointillé pâle en fond. */
  comparisonValues?: (number | null)[];
  min?: number;
  max?: number;
  width?: number;
  height?: number;
  color?: string;
}

/** Anneau qui pulse en douceur (jamais un clignotement) derrière le point
 * du dernier trimestre connu, pour signaler "c'est ici, maintenant".
 * Implémenté en `Animated.View` positionné en superposition plutôt qu'en
 * animant un attribut SVG (`Animated.createAnimatedComponent(Circle)`
 * fuit des props RN-only comme `collapsable` vers le DOM sur le rendu
 * web et déclenche des avertissements React) — même pattern de
 * superposition que les zones tactiles du radar de compétences. */
function PulsingPoint({ x, y, color }: { x: number; y: number; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 2200, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.6] });
  const opacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 0.1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x - 5,
        top: y - 5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

/** Courbe de tendance — moyenne générale au fil des trimestres/semestres
 * publiés (ReportCard réels, jamais de donnée inventée). Générique : le
 * nombre de points suit le découpage de l'établissement (3 trimestres au
 * primaire/collège/lycée, 2 semestres au supérieur). Ligne lissée à
 * jonctions arrondies, dernier point (trimestre le plus récent connu)
 * pulsant doucement. */
export function GradeTrendChart({
  points, comparisonValues, min = 0, max = 20, width = 320, height = 170, color = "#FB5406",
}: GradeTrendChartProps) {
  const paddingX = 20;
  const paddingTop = 26;
  const paddingBottom = 26;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const xFor = (i: number) => paddingX + (points.length > 1 ? stepX * i : chartWidth / 2);
  const yFor = (value: number) => {
    const ratio = (value - min) / Math.max(max - min, 1);
    return paddingTop + chartHeight - Math.max(0, Math.min(1, ratio)) * chartHeight;
  };

  if (points.length === 0) return null;

  const svgPoints = points.map((p, i) => ({ x: xFor(i), y: yFor(p.value) }));
  const linePath = smoothOpenPath(svgPoints);
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${paddingTop + chartHeight} L ${xFor(0)} ${paddingTop + chartHeight} Z`;

  const comparisonPoints = (comparisonValues ?? [])
    .map((value, i) => (value != null ? { x: xFor(i), y: yFor(value) } : null))
    .filter((p): p is { x: number; y: number } => p !== null);
  const comparisonPath = comparisonPoints.length > 1 ? smoothOpenPath(comparisonPoints) : null;

  const lastPoint = svgPoints[svgPoints.length - 1];

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradeTrendFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.3} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {[0, 0.5, 1].map((r) => (
          <Line
            key={r}
            x1={paddingX}
            x2={width - paddingX}
            y1={paddingTop + chartHeight * (1 - r)}
            y2={paddingTop + chartHeight * (1 - r)}
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        ))}
        <Path d={areaPath} fill="url(#gradeTrendFill)" />
        {comparisonPath ? (
          <Path d={comparisonPath} stroke="#CBD5E1" strokeWidth={1.4} strokeDasharray="4,4" fill="none" opacity={0.85} />
        ) : null}
        <Path d={linePath} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={xFor(i)} cy={yFor(p.value)} r={4.5} fill="#FFFFFF" stroke={color} strokeWidth={2.5} />
        ))}
        {points.map((p, i) => (
          <SvgText key={`v-${i}`} x={xFor(i)} y={yFor(p.value) - 12} fontSize={11} fontWeight="700" fill="#0F172A" textAnchor="middle">
            {p.value.toFixed(1)}
          </SvgText>
        ))}
        {points.map((p, i) => (
          <SvgText key={`l-${i}`} x={xFor(i)} y={height - 8} fontSize={10} fontWeight="600" fill="#5A6A8A" textAnchor="middle">
            {p.label}
          </SvgText>
        ))}
      </Svg>
      {lastPoint ? <PulsingPoint x={lastPoint.x} y={lastPoint.y} color={color} /> : null}
    </View>
  );
}
