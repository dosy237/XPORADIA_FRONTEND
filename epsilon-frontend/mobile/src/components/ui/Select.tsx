import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  placeholder = "Sélectionner...",
  value,
  options,
  onChange,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-xporadia-text-secondary">{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xporadia border border-xporadia-border px-4 py-3"
      >
        <Text className={selected ? "text-xporadia-text-primary text-base" : "text-xporadia-text-secondary text-base"}>
          {selected?.label ?? placeholder}
        </Text>
        <Text className="text-xporadia-text-secondary">▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <SafeAreaView edges={["bottom"]} className="bg-white rounded-t-3xl max-h-[70%]">
          <View className="items-center py-3">
            <View className="w-10 h-1 rounded-full bg-xporadia-border" />
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className="px-6 py-4 border-b border-xporadia-border"
              >
                <Text
                  className={
                    item.value === value
                      ? "text-xporadia-orange-text font-semibold text-base"
                      : "text-xporadia-text-primary text-base"
                  }
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
