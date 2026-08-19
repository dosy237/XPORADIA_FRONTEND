import { Circle, Defs, Line, LinearGradient, Path, Stop, Svg, Text as SvgText } from "react-native-svg";

export interface TrendPoint {
  label: string;
  value: number;
}

interface GradeTrendChartProps {
  points: TrendPoint[];
  min?: number;
  max?: number;
  width?: number;
  height?: number;
  color?: string;
}

/** Courbe de tendance — moyenne générale au fil des trimestres/semestres
 * publiés (ReportCard réels, jamais de donnée inventée). Générique : le
 * nombre de points suit le découpage de l'établissement (3 trimestres au
 * primaire/collège/lycée, 2 semestres au supérieur). */
export function GradeTrendChart({
  points, min = 0, max = 20, width = 320, height = 170, color = "#FB5406",
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

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${paddingTop + chartHeight} L ${xFor(0)} ${paddingTop + chartHeight} Z`;

  return (
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
  );
}
