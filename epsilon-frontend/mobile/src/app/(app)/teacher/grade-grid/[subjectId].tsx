import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, CloseIcon, FileTextIcon, GraduationCapIcon, PlusIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as gradingApi from "@/services/grading";
import type { EvalType, Evaluation, GradeGrid, GradeGridEntry, GradeGridStudent } from "@/services/grading";

const NAME_COL_WIDTH = 160;
const EVAL_COL_MIN_WIDTH = 112;
const EVAL_COL_MAX_WIDTH = 178;
const AVG_COL_WIDTH = 84;
const HEADER_HEIGHT = 92;
const ROW_HEIGHT = 64;

/** Largeur de colonne calculée à partir du titre de l'évaluation — un
 * intitulé court ("Devoir 3") n'a pas besoin de la même largeur qu'un
 * intitulé long ("Interrogation n°3"). Fixer une largeur unique pour
 * toutes les colonnes tronquait systématiquement les titres un peu
 * longs ; ici chaque colonne s'adapte au sien, dans les bornes
 * min/max, pour ne jamais couper un en-tête. */
function evaluationColumnWidth(title: string) {
  const estimated = 56 + title.length * 6.4;
  return Math.max(EVAL_COL_MIN_WIDTH, Math.min(EVAL_COL_MAX_WIDTH, Math.round(estimated)));
}

function toLocalDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Champ date seule pour le formulaire d'évaluation — même principe que
 * DeadlinePicker (repli input HTML sur web, DateTimePicker natif
 * ailleurs), mais sans l'heure : une évaluation n'a qu'une date. */
function EvalDateField({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-xporadia-text-secondary">Date</Text>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <input
          type="date"
          value={toLocalDateInputValue(value)}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.value) onChange(new Date(event.target.value));
          }}
          style={{
            border: `1px solid ${Colors.border}`,
            borderRadius: 16,
            padding: 12,
            fontSize: 14,
            fontFamily: "inherit",
            color: Colors.textPrimary,
          }}
        />
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-xporadia-text-secondary">Date</Text>
      <Pressable
        onPress={() => setShow(true)}
        accessibilityRole="button"
        className="border border-xporadia-border rounded-2xl px-4 py-3.5"
      >
        <Text className="text-sm text-xporadia-text-primary">
          {value.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode="date"
          onChange={(event, selected) => {
            setShow(false);
            if (event.type === "dismissed" || !selected) return;
            onChange(selected);
          }}
        />
      ) : null}
    </View>
  );
}

/** Formulaire "Ajouter une colonne" — sans quitter l'écran, la colonne
 * apparaît immédiatement dans la grille (voir onSuccess côté écran
 * parent qui insère l'évaluation renvoyée dans le cache React Query). */
function AddEvaluationSheet({
  visible,
  loading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; eval_type: EvalType; coefficient: number; max_score: number; date: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [evalType, setEvalType] = useState<EvalType>("homework");
  const [coefficient, setCoefficient] = useState("1");
  const [maxScore, setMaxScore] = useState("20");
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (!visible) return;
    setTitle("");
    setEvalType("homework");
    setCoefficient("1");
    setMaxScore("20");
    setDate(new Date());
  }, [visible]);

  if (!visible) return null;

  const canSubmit = title.trim().length > 0 && Number(coefficient) > 0 && Number(maxScore) > 0;

  return (
    <Pressable
      className="absolute inset-0 bg-black/30 items-center justify-center px-6"
      style={{ zIndex: 20 }}
      onPress={onClose}
    >
      <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full p-5 gap-3.5 shadow-deep">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-xporadia-navy">Nouvelle évaluation</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={8}>
            <CloseIcon size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Interrogation n°3" />

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-xporadia-text-secondary">Type</Text>
          <View className="flex-row gap-2">
            {(Object.keys(gradingApi.EVAL_TYPE_LABELS) as EvalType[]).map((key) => (
              <Chip
                key={key}
                label={gradingApi.EVAL_TYPE_LABELS[key]}
                variant={evalType === key ? "navy" : "navy-subtle"}
                onPress={() => setEvalType(key)}
              />
            ))}
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Coefficient" value={coefficient} onChangeText={setCoefficient} keyboardType="number-pad" />
          </View>
          <View className="flex-1">
            <Input label="Barème" value={maxScore} onChangeText={setMaxScore} keyboardType="number-pad" placeholder="20" />
          </View>
        </View>

        <EvalDateField value={date} onChange={setDate} />

        <View className="flex-row gap-3 mt-1">
          <View className="flex-1">
            <Button label="Annuler" variant="secondary" pill onPress={onClose} />
          </View>
          <View className="flex-1">
            <Button
              label="Ajouter"
              pill
              disabled={!canSubmit}
              loading={loading}
              onPress={() =>
                onSubmit({
                  title: title.trim(),
                  eval_type: evalType,
                  coefficient: Number(coefficient),
                  max_score: Number(maxScore),
                  date: date.toISOString().slice(0, 10),
                })
              }
            />
          </View>
        </View>
      </Pressable>
    </Pressable>
  );
}

/** Appréciation courte de l'enseignant dédié pour UN élève dans SA
 * matière — ouverte en tapant son nom dans la colonne fixe. Brouillon
 * indépendant des notes, copié dans le bulletin figé à la génération. */
function AppreciationSheet({
  student,
  loading,
  onClose,
  onSubmit,
}: {
  student: GradeGridStudent | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (student) setComment(student.appreciation);
  }, [student]);

  if (!student) return null;

  return (
    <Pressable
      className="absolute inset-0 bg-black/30 items-center justify-center px-6"
      style={{ zIndex: 20 }}
      onPress={onClose}
    >
      <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full p-5 gap-3.5 shadow-deep">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-xporadia-navy">
            Appréciation, {student.first_name} {student.last_name}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={8}>
            <CloseIcon size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <Input
          value={comment}
          onChangeText={setComment}
          placeholder="Élève sérieux, en progrès ce trimestre..."
          multiline
          numberOfLines={3}
          maxLength={300}
          style={{ height: 90, textAlignVertical: "top" }}
        />

        <View className="flex-row gap-3 mt-1">
          <View className="flex-1">
            <Button label="Annuler" variant="secondary" pill onPress={onClose} />
          </View>
          <View className="flex-1">
            <Button label="Enregistrer" pill loading={loading} onPress={() => onSubmit(comment.trim())} />
          </View>
        </View>
      </Pressable>
    </Pressable>
  );
}

function EvaluationHeaderCell({ evaluation, width }: { evaluation: Evaluation; width: number }) {
  return (
    <View
      style={{ width, height: HEADER_HEIGHT }}
      className="px-2.5 py-2 justify-between border-b border-r border-xporadia-border/70 bg-xporadia-navy/5"
    >
      {/* Pas de numberOfLines strict ici : la largeur de la colonne est déjà
          calculée pour le titre (evaluationColumnWidth), donc 3 lignes
          couvrent large sans jamais avoir besoin de couper le texte en
          usage réel. */}
      <Text numberOfLines={3} className="text-[11px] font-bold text-xporadia-navy leading-3.5">
        {evaluation.title}
      </Text>
      <Text className="text-[9px] text-xporadia-text-secondary" numberOfLines={1}>
        {gradingApi.EVAL_TYPE_LABELS[evaluation.eval_type]}, coef {evaluation.coefficient}
      </Text>
      {/* Échelle toujours visible en badge, sur sa propre ligne — pour ne
          jamais se tromper de barème en saisissant une note, et pour ne
          jamais se faire écraser par le texte voisin dans les colonnes
          les plus étroites. */}
      <View className="self-start bg-xporadia-orange/15 rounded-full px-1.5 py-0.5">
        <Text className="text-[9px] font-bold text-xporadia-orange-text">/{evaluation.max_score}</Text>
      </View>
    </View>
  );
}

function GradeCell({
  student,
  evaluation,
  width,
  isActive,
  justSaved,
  onActivate,
  onSave,
}: {
  student: GradeGridStudent;
  evaluation: Evaluation;
  width: number;
  isActive: boolean;
  justSaved: boolean;
  onActivate: () => void;
  onSave: (payload: { score: string | null; is_excused: boolean }) => void;
}) {
  const cellData = student.grades[String(evaluation.id)] ?? null;
  const [draft, setDraft] = useState(cellData?.score ?? "");
  const [excused, setExcused] = useState(cellData?.is_excused ?? false);

  useEffect(() => {
    if (!isActive) return;
    setDraft(cellData?.score ?? "");
    setExcused(cellData?.is_excused ?? false);
    // Ne réinitialiser qu'à l'activation de LA cellule, pas à chaque
    // rendu (sinon la saisie en cours serait effacée par le refetch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const commit = (nextExcused: boolean, nextDraft: string) => {
    onSave({
      score: nextExcused ? null : nextDraft.trim() === "" ? null : nextDraft.trim(),
      is_excused: nextExcused,
    });
  };

  if (!isActive) {
    const ratio = cellData?.score ? Number(cellData.score) / evaluation.max_score : null;
    const scoreColor =
      ratio === null ? Colors.textPrimary : ratio >= 0.5 ? Colors.green : Colors.red;
    return (
      <Pressable
        onPress={onActivate}
        accessibilityRole="button"
        style={{ width, height: ROW_HEIGHT }}
        className="items-center justify-center border-b border-r border-xporadia-border/70"
      >
        {cellData?.is_excused ? (
          <Text className="text-[10px] font-semibold text-xporadia-orange-text">Dispensé</Text>
        ) : cellData?.score ? (
          <Text className="text-base font-extrabold" style={{ color: scoreColor }}>
            {cellData.score}
          </Text>
        ) : (
          <Text className="text-xs text-xporadia-border">—</Text>
        )}
        {justSaved ? (
          <View className="absolute top-1 right-1">
            <CheckCircleIcon size={11} color={Colors.green} />
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View
      style={{ width, height: ROW_HEIGHT }}
      className="items-center justify-center gap-1 border-b border-r border-xporadia-orange bg-xporadia-orange/5 px-1"
    >
      <TextInput
        autoFocus
        value={draft}
        onChangeText={setDraft}
        onBlur={() => commit(excused, draft)}
        keyboardType="decimal-pad"
        editable={!excused}
        className={`text-sm font-bold text-center w-full ${excused ? "text-xporadia-border" : "text-xporadia-navy"}`}
      />
      <Pressable
        onPress={() => {
          const next = !excused;
          setExcused(next);
          commit(next, draft);
        }}
        accessibilityRole="button"
        hitSlop={6}
      >
        <Text className={`text-[8px] font-bold ${excused ? "text-xporadia-orange-text" : "text-xporadia-text-secondary"}`}>
          Dispensé
        </Text>
      </Pressable>
    </View>
  );
}

/** Élèves en lignes (colonne fixe), évaluations en colonnes (défilement
 * horizontal), moyenne toujours visible à droite (colonne fixe elle
 * aussi) — les deux colonnes fixes sont des ScrollView non-interactives
 * (scrollEnabled=false), pilotées par le défilement vertical de la zone
 * centrale, seule source de vérité : jamais de boucle de synchronisation
 * entre plusieurs ScrollView interactives. */
function GradeGridTable({
  grid,
  activeCell,
  justSavedCell,
  onActivateCell,
  onSaveCell,
  onOpenAppreciation,
}: {
  grid: GradeGrid;
  activeCell: { evaluationId: number; childId: number } | null;
  justSavedCell: { evaluationId: number; childId: number } | null;
  onActivateCell: (cell: { evaluationId: number; childId: number }) => void;
  onSaveCell: (entry: GradeGridEntry) => void;
  onOpenAppreciation: (student: GradeGridStudent) => void;
}) {
  const leftScrollRef = useRef<ScrollView>(null);
  const rightScrollRef = useRef<ScrollView>(null);

  const syncVerticalScroll = (y: number) => {
    leftScrollRef.current?.scrollTo({ y, animated: false });
    rightScrollRef.current?.scrollTo({ y, animated: false });
  };

  if (grid.students.length === 0) {
    return (
      <View className="items-center gap-2 py-16 px-6">
        <GraduationCapIcon size={22} color={Colors.textSecondary} />
        <Text className="text-xs text-xporadia-text-secondary text-center">Aucun élève inscrit dans cette classe.</Text>
      </View>
    );
  }

  if (grid.evaluations.length === 0) {
    return (
      <View className="items-center gap-2 py-16 px-6">
        <GraduationCapIcon size={22} color={Colors.textSecondary} />
        <Text className="text-xs text-xporadia-text-secondary text-center">
          Aucune évaluation pour ce trimestre. Ajoutez une colonne pour commencer.
        </Text>
      </View>
    );
  }

  // Largeur par colonne, calculée une fois par rendu de grille — partagée
  // entre l'en-tête et chaque cellule de la même évaluation pour que les
  // deux zones défilantes restent alignées.
  const columnWidths = Object.fromEntries(
    grid.evaluations.map((evaluation) => [evaluation.id, evaluationColumnWidth(evaluation.title)])
  );

  return (
    <View className="flex-1 flex-row mx-4 rounded-2xl overflow-hidden shadow-soft bg-white">
      <View style={{ width: NAME_COL_WIDTH }} className="border-r border-xporadia-border/70 bg-white">
        <View style={{ height: HEADER_HEIGHT }} className="justify-center px-3.5 border-b border-xporadia-border/70 bg-xporadia-navy/5">
          <Text className="text-[11px] font-bold text-xporadia-text-secondary uppercase">Élève</Text>
        </View>
        <ScrollView ref={leftScrollRef} scrollEnabled={false} showsVerticalScrollIndicator={false}>
          {grid.students.map((student, index) => (
            <Pressable
              key={student.child_id}
              onPress={() => onOpenAppreciation(student)}
              accessibilityRole="button"
              accessibilityLabel={`Appréciation de ${student.first_name} ${student.last_name}`}
              style={{ height: ROW_HEIGHT }}
              className={`flex-row items-center gap-2.5 px-3.5 border-b border-xporadia-border/70 ${
                index % 2 === 1 ? "bg-xporadia-bg/60" : "bg-white"
              }`}
            >
              <Avatar firstName={student.first_name} lastName={student.last_name} imageUri={student.avatar} size={32} />
              <Text numberOfLines={2} className="flex-1 text-xs font-semibold text-xporadia-text-primary leading-4">
                {student.first_name} {student.last_name}
              </Text>
              {student.appreciation ? <FileTextIcon size={11} color={Colors.orange} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }}>
        <View>
          <View style={{ height: HEADER_HEIGHT, flexDirection: "row" }}>
            {grid.evaluations.map((evaluation) => (
              <EvaluationHeaderCell key={evaluation.id} evaluation={evaluation} width={columnWidths[evaluation.id]} />
            ))}
          </View>
          <ScrollView
            onScroll={(event) => syncVerticalScroll(event.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {grid.students.map((student, index) => (
              <View
                key={student.child_id}
                style={{ height: ROW_HEIGHT, flexDirection: "row" }}
                className={index % 2 === 1 ? "bg-xporadia-bg/60" : "bg-white"}
              >
                {grid.evaluations.map((evaluation) => {
                  const isActive = activeCell?.evaluationId === evaluation.id && activeCell?.childId === student.child_id;
                  const isJustSaved =
                    justSavedCell?.evaluationId === evaluation.id && justSavedCell?.childId === student.child_id;
                  return (
                    <GradeCell
                      key={evaluation.id}
                      student={student}
                      evaluation={evaluation}
                      width={columnWidths[evaluation.id]}
                      isActive={isActive}
                      justSaved={isJustSaved}
                      onActivate={() => onActivateCell({ evaluationId: evaluation.id, childId: student.child_id })}
                      onSave={(payload) => onSaveCell({ evaluation: evaluation.id, child: student.child_id, ...payload })}
                    />
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={{ width: AVG_COL_WIDTH }} className="border-l border-xporadia-border/70 bg-white">
        <View style={{ height: HEADER_HEIGHT }} className="items-center justify-center px-1 border-b border-xporadia-border/70 bg-xporadia-navy/5">
          <Text className="text-[10px] font-bold text-xporadia-text-secondary uppercase text-center">Moyenne</Text>
        </View>
        <ScrollView ref={rightScrollRef} scrollEnabled={false} showsVerticalScrollIndicator={false}>
          {grid.students.map((student, index) => {
            const average = student.subject_average ? Number(student.subject_average) : null;
            const tint = average === null ? null : average >= 10 ? "green" : "red";
            return (
              <View
                key={student.child_id}
                style={{ height: ROW_HEIGHT }}
                className={`items-center justify-center px-1 border-b border-xporadia-border/70 ${
                  index % 2 === 1 ? "bg-xporadia-bg/60" : "bg-white"
                }`}
              >
                {student.subject_average ? (
                  <View
                    className={`rounded-full px-2.5 py-1 ${tint === "green" ? "bg-xporadia-green/15" : "bg-xporadia-red/10"}`}
                  >
                    <Text
                      className="text-sm font-extrabold"
                      style={{ color: tint === "green" ? Colors.green : Colors.red }}
                    >
                      {student.subject_average}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs text-xporadia-border">—</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/** Tableur de notes d'une matière — moyenne de CETTE matière uniquement
 * (évaluations pondérées entre elles par leur propre coefficient).
 * Jamais pondérée par Subject.coefficient, jamais la moyenne générale,
 * jamais de lien vers le système de bulletin (ReportCard) : chantiers
 * séparés, volontairement hors de portée ici. */
export default function TeacherGradeGridScreen() {
  const { subjectId: subjectIdParam } = useLocalSearchParams<{ subjectId: string }>();
  const subjectId = Number(subjectIdParam);
  const queryClient = useQueryClient();

  const { data: terms } = useQuery({
    queryKey: ["subject-terms", subjectId],
    queryFn: () => gradingApi.fetchSubjectTerms(subjectId),
    enabled: !!subjectId,
  });

  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedTermId || !terms || terms.length === 0) return;
    const active = terms.find((t) => t.is_active);
    setSelectedTermId((active ?? terms[0]).id);
  }, [terms, selectedTermId]);

  const gridQueryKey = ["grade-grid", subjectId, selectedTermId];
  const { data: grid, isLoading } = useQuery({
    queryKey: gridQueryKey,
    queryFn: () => gradingApi.fetchGradeGrid(subjectId, selectedTermId as number),
    enabled: !!subjectId && !!selectedTermId,
  });

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ evaluationId: number; childId: number } | null>(null);
  const [justSavedCell, setJustSavedCell] = useState<{ evaluationId: number; childId: number } | null>(null);

  const saveMutation = useMutation({
    mutationFn: (entry: GradeGridEntry) => gradingApi.saveGradeGridEntries(subjectId, selectedTermId as number, [entry]),
    onSuccess: (result, entry) => {
      queryClient.setQueryData<GradeGrid | undefined>(gridQueryKey, (prev) => {
        if (!prev) return prev;
        const savedGrade = result.saved.find((g) => g.evaluation === entry.evaluation && g.child === entry.child);
        return {
          ...prev,
          students: prev.students.map((student) => {
            if (student.child_id !== entry.child) return student;
            return {
              ...student,
              grades: {
                ...student.grades,
                [String(entry.evaluation)]: savedGrade
                  ? {
                      score: savedGrade.score,
                      is_excused: savedGrade.is_excused,
                      updated_by_name: savedGrade.updated_by_name,
                      updated_at: savedGrade.updated_at,
                    }
                  : null,
              },
              subject_average: result.updated_averages[String(entry.child)] ?? student.subject_average,
            };
          }),
        };
      });
      setJustSavedCell({ evaluationId: entry.evaluation, childId: entry.child });
      setTimeout(() => setJustSavedCell(null), 1400);
    },
  });

  const createEvaluationMutation = useMutation({
    mutationFn: (payload: { title: string; eval_type: EvalType; coefficient: number; max_score: number; date: string }) =>
      gradingApi.createEvaluation(subjectId, { ...payload, term: selectedTermId as number }),
    onSuccess: (evaluation) => {
      queryClient.setQueryData<GradeGrid | undefined>(gridQueryKey, (prev) =>
        prev ? { ...prev, evaluations: [...prev.evaluations, evaluation] } : prev
      );
      setAddSheetOpen(false);
    },
  });

  // Traçabilité minimale (Point 8) : dernière modification de la cellule
  // actuellement ouverte, affichée juste au-dessus de la grille plutôt
  // que dans la cellule elle-même (bien trop étroite pour du texte).
  const activeCellTrace = (() => {
    if (!activeCell || !grid) return null;
    const student = grid.students.find((s) => s.child_id === activeCell.childId);
    const cell = student?.grades[String(activeCell.evaluationId)];
    if (!cell?.updated_by_name) return null;
    const date = new Date(cell.updated_at);
    return `Dernière modification par ${cell.updated_by_name}, le ${date.toLocaleDateString("fr-FR")} à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  })();

  const [appreciationTarget, setAppreciationTarget] = useState<GradeGridStudent | null>(null);
  const saveAppreciationMutation = useMutation({
    mutationFn: (comment: string) =>
      gradingApi.saveSubjectAppreciation(subjectId, selectedTermId as number, appreciationTarget!.child_id, comment),
    onSuccess: (result) => {
      queryClient.setQueryData<GradeGrid | undefined>(gridQueryKey, (prev) =>
        prev
          ? {
              ...prev,
              students: prev.students.map((student) =>
                student.child_id === result.child_id ? { ...student, appreciation: result.comment } : student
              ),
            }
          : prev
      );
      setAppreciationTarget(null);
    },
  });

  return (
    <View className="flex-1 bg-xporadia-bg">
      <Stack.Screen options={{ title: "Tableur de notes" }} />

      <View className="px-4 pt-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {(terms ?? []).map((term) => (
            <Chip
              key={term.id}
              label={term.name || `Trimestre ${term.number}`}
              variant={selectedTermId === term.id ? "navy" : "navy-subtle"}
              onPress={() => {
                setSelectedTermId(term.id);
                setActiveCell(null);
              }}
            />
          ))}
        </ScrollView>
      </View>

      <View className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-xs text-xporadia-text-secondary">
          {grid ? `${grid.students.length} élève${grid.students.length !== 1 ? "s" : ""}, ${grid.evaluations.length} évaluation${grid.evaluations.length !== 1 ? "s" : ""}` : ""}
        </Text>
        <Pressable
          onPress={() => setAddSheetOpen(true)}
          disabled={!selectedTermId}
          accessibilityRole="button"
          className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${selectedTermId ? "bg-xporadia-navy" : "bg-xporadia-border"}`}
        >
          <PlusIcon size={13} color={Colors.white} />
          <Text className="text-xs font-bold text-white">Ajouter une colonne</Text>
        </Pressable>
      </View>

      {activeCellTrace ? (
        <View className="px-4 pb-2">
          <Text className="text-[11px] text-xporadia-text-secondary" numberOfLines={2}>
            {activeCellTrace}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-10">Chargement...</Text>
      ) : grid ? (
        <GradeGridTable
          grid={grid}
          activeCell={activeCell}
          justSavedCell={justSavedCell}
          onActivateCell={setActiveCell}
          onSaveCell={(entry) => {
            setActiveCell(null);
            saveMutation.mutate(entry);
          }}
          onOpenAppreciation={setAppreciationTarget}
        />
      ) : (
        <View className="items-center gap-2 py-16">
          <GraduationCapIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Sélectionnez un trimestre.</Text>
        </View>
      )}

      <AddEvaluationSheet
        visible={addSheetOpen}
        loading={createEvaluationMutation.isPending}
        onClose={() => setAddSheetOpen(false)}
        onSubmit={(payload) => createEvaluationMutation.mutate(payload)}
      />

      <AppreciationSheet
        student={appreciationTarget}
        loading={saveAppreciationMutation.isPending}
        onClose={() => setAppreciationTarget(null)}
        onSubmit={(comment) => saveAppreciationMutation.mutate(comment)}
      />
    </View>
  );
}
