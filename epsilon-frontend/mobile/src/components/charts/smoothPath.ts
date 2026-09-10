export interface Point {
  x: number;
  y: number;
}

/** Conversion Catmull-Rom → Bézier cubique — sert à donner des jonctions
 * arrondies aux courbes/formes de graphique (courbe de progression, radar
 * de compétences) plutôt que des segments droits à angles durs, sans
 * dépendance externe. `closed` boucle la spline sur elle-même (radar). */
function catmullRomToBezier(points: Point[], closed: boolean): string {
  if (points.length < 2) return "";
  const p = points;
  const n = p.length;
  const get = (i: number) => {
    if (closed) return p[(i + n) % n];
    if (i < 0) return p[0];
    if (i >= n) return p[n - 1];
    return p[i];
  };

  let d = `M ${p[0].x} ${p[0].y}`;
  const segmentCount = closed ? n : n - 1;
  for (let i = 0; i < segmentCount; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  if (closed) d += " Z";
  return d;
}

/** Ligne ouverte lissée (courbe de progression). */
export function smoothOpenPath(points: Point[]): string {
  return catmullRomToBezier(points, false);
}

/** Forme fermée lissée (contour du radar de compétences). */
export function smoothClosedPath(points: Point[]): string {
  return catmullRomToBezier(points, true);
}
