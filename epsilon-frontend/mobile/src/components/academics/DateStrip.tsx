import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

export const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const WEEKDAY_SHORT = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
export const MONTH_LABELS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
export const MONTH_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const STRIP_DAYS_BEFORE = 30;
const STRIP_DAYS_AFTER = 240;
const STRIP_ITEM_WIDTH = 52;
const STRIP_ITEM_GAP = 8;

export function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function weekdayOfISO(iso: string) {
  // Date.getDay() : dimanche=0..samedi=6 -> on veut lundi=0..dimanche=6
  const jsDay = new Date(`${iso}T00:00:00`).getDay();
  return (jsDay + 6) % 7;
}

/** Bande de dates parcourable horizontalement, un jour sélectionné à la
 * fois — jamais plusieurs colonnes de jours côte à côte sur mobile.
 * Partagée entre l'agenda élève et l'agenda enseignant : par défaut
 * aujourd'hui est visible et centré ; n'importe quelle date de la bande
 * reste sélectionnable en un tap. Le jour actif reprend le dégradé
 * navy -> orange déjà établi pour l'en-tête du tableau de bord (matière
 * et lumière), jamais un aplat. */
export function DateStrip({ selectedDate, onSelect }: { selectedDate: string; onSelect: (iso: string) => void }) {
  const listRef = useRef<FlatList<string>>(null);
  const today = useMemo(() => todayISO(), []);
  const dates = useMemo(() => {
    const base = new Date(`${today}T00:00:00`);
    const arr: string[] = [];
    for (let i = -STRIP_DAYS_BEFORE; i <= STRIP_DAYS_AFTER; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      arr.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    return arr;
  }, [today]);

  const selectedIndex = dates.indexOf(selectedDate);

  useEffect(() => {
    if (selectedIndex < 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: selectedIndex, viewPosition: 0.5, animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  return (
    <FlatList
      ref={listRef}
      data={dates}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(iso) => iso}
      contentContainerStyle={{ paddingHorizontal: 24, gap: STRIP_ITEM_GAP, alignItems: "flex-end" }}
      getItemLayout={(_, index) => ({
        length: STRIP_ITEM_WIDTH + STRIP_ITEM_GAP,
        offset: (STRIP_ITEM_WIDTH + STRIP_ITEM_GAP) * index,
        index,
      })}
      onScrollToIndexFailed={({ index }) => {
        setTimeout(() => listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false }), 80);
      }}
      renderItem={({ item: iso }) => {
        const d = new Date(`${iso}T00:00:00`);
        const active = iso === selectedDate;
        const isToday = iso === today;
        const showsMonth = d.getDate() === 1 || iso === dates[0];
        return (
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                color: Colors.textSecondary,
                marginBottom: 2,
                textTransform: "uppercase",
                opacity: showsMonth ? 1 : 0,
              }}
            >
              {MONTH_SHORT[d.getMonth()]}
            </Text>
            <Pressable
              onPress={() => onSelect(iso)}
              accessibilityRole="button"
              accessibilityLabel={`${WEEKDAY_LABELS[weekdayOfISO(iso)]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`}
            >
              {active ? (
                <LinearGradient
                  colors={[Colors.navy, Colors.orangeLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: STRIP_ITEM_WIDTH,
                    height: 64,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.75)" }}>
                    {WEEKDAY_SHORT[weekdayOfISO(iso)]}
                  </Text>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: Colors.white }}>{d.getDate()}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={{
                    width: STRIP_ITEM_WIDTH,
                    height: 64,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    backgroundColor: Colors.white,
                    borderWidth: isToday ? 1.5 : 1,
                    borderColor: isToday ? Colors.orange : Colors.border,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: Colors.textSecondary }}>
                    {WEEKDAY_SHORT[weekdayOfISO(iso)]}
                  </Text>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: isToday ? Colors.orange : Colors.textPrimary }}>
                    {d.getDate()}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        );
      }}
    />
  );
}
