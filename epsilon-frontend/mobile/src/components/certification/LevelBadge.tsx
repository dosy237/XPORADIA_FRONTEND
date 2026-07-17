import { Text, View } from "react-native";

import { MedalIcon } from "@/components/ui/Icon";
import { LEVEL_COLORS, LEVEL_LABELS, LEVEL_ORDER } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import type { CertificationLevel } from "@/services/certification";

export function LevelBadge({ level, size = 40 }: { level: CertificationLevel; size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-full border-2 border-white"
      style={{ width: size, height: size, backgroundColor: LEVEL_COLORS[level] }}
    >
      <MedalIcon color="#FFFFFF" size={size * 0.5} />
    </View>
  );
}

export function LevelPath({ current }: { current: CertificationLevel | null }) {
  const currentIndex = current ? LEVEL_ORDER.indexOf(current) : -1;

  return (
    <View className="flex-row items-center justify-between px-2">
      {LEVEL_ORDER.map((level, index) => {
        const achieved = index <= currentIndex;
        return (
          <View key={level} className="items-center gap-2 flex-1">
            <View className="flex-row items-center w-full">
              {index > 0 && (
                <View
                  className={`h-0.5 flex-1 ${achieved ? "bg-xporadia-navy" : "bg-xporadia-border"}`}
                />
              )}
              <View
                className="h-8 w-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: achieved ? LEVEL_COLORS[level] : Colors.border,
                }}
              >
                <MedalIcon color={achieved ? "#FFFFFF" : Colors.textSecondary} size={16} />
              </View>
              {index < LEVEL_ORDER.length - 1 && (
                <View
                  className={`h-0.5 flex-1 ${
                    index < currentIndex ? "bg-xporadia-navy" : "bg-xporadia-border"
                  }`}
                />
              )}
            </View>
            <Text
              className={`text-xs font-semibold ${
                achieved ? "text-xporadia-navy" : "text-xporadia-text-secondary"
              }`}
            >
              {LEVEL_LABELS[level]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
