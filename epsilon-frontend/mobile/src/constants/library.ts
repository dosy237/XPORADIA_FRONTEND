import type { ResourceCategory, ResourceType, SchoolLevel } from "@/services/library";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  course: "Cours",
  revision: "Fiche de révision",
  exercise: "Exercice",
  solution: "Corrigé",
  exam: "Annale BEPC/BAC",
};

export const RESOURCE_TYPE_ORDER: ResourceType[] = [
  "course",
  "revision",
  "exercise",
  "solution",
  "exam",
];

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  "6e": "6ème",
  "5e": "5ème",
  "4e": "4ème",
  "3e": "3ème",
  "2nde": "Seconde",
  "1ere": "Première",
  tle: "Terminale",
};

export const SCHOOL_LEVEL_ORDER: SchoolLevel[] = ["6e", "5e", "4e", "3e", "2nde", "1ere", "tle"];

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  academic: "Scolaire",
  literature: "Littérature",
  society: "Société & anthropologie",
  science: "Sciences & vulgarisation",
  biography: "Biographies & entrepreneuriat",
  arts: "Arts",
  environment: "Environnement",
};

// Le rayon scolaire vient en premier (c'est le seul réellement peuplé
// aujourd'hui) ; les suivants n'apparaissent dans l'écran que s'ils
// contiennent au moins une ressource — pas de rayon vide affiché.
export const RESOURCE_CATEGORY_ORDER: ResourceCategory[] = [
  "academic",
  "literature",
  "society",
  "science",
  "biography",
  "arts",
  "environment",
];
