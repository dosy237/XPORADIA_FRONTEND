import { LevelBadge } from "@/components/certification/LevelBadge";
import { LEVEL_ORDER } from "@/constants/certificationLevels";
import type { CertificationLevel } from "@/services/certification";

const GOLD_INDEX = LEVEL_ORDER.indexOf("gold");

/** Or, Platine ou Diamant — jamais une égalité stricte avec "gold" seul,
 * qui exclurait à tort les paliers au-dessus. */
export function isGoldOrAbove(level: CertificationLevel | null | undefined): level is CertificationLevel {
  if (!level) return false;
  return LEVEL_ORDER.indexOf(level) >= GOLD_INDEX;
}

/** Pastille discrète signalant qu'un enseignant a atteint Or ou plus —
 * toujours mérité par des points cumulés, jamais acheté (contrairement au
 * badge "Partenaire" des entreprises/établissements, qui est un statut
 * payant). N'apparaît jamais en dessous de Or. Réutilise LevelBadge (déjà
 * établi sur la fiche enseignant pour chaque certification individuelle)
 * plutôt qu'un nouveau traitement visuel isolé — un seul composant,
 * partout où l'identité d'un enseignant apparaît à côté de sa photo :
 * carte et fiche d'annuaire, auteur d'une publication. */
export function CertificationBadge({
  level,
  size = 22,
}: {
  level: CertificationLevel | null | undefined;
  size?: number;
}) {
  if (!isGoldOrAbove(level)) return null;
  return <LevelBadge level={level} size={size} />;
}
