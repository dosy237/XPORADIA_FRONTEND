import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

// Adapter Zustand persist : expo-secure-store (chiffré) sur iOS/Android,
// AsyncStorage sur web (SecureStore n'y est pas disponible).
export const secureStorage: StateStorage =
  Platform.OS === "web"
    ? AsyncStorage
    : {
        getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
        setItem: async (name, value) => {
          await SecureStore.setItemAsync(name, value);
        },
        removeItem: async (name) => {
          await SecureStore.deleteItemAsync(name);
        },
      };
