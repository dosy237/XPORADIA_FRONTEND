import { create } from "zustand";

interface ImageViewerState {
  uri: string | null;
  open: (uri: string) => void;
  close: () => void;
}

/** État global minimal pour la visionneuse plein écran : n'importe quel
 * composant peut appeler open(uri) sans avoir à connaître ni monter
 * lui-même la Modal (rendue une seule fois à la racine de l'app, voir
 * ImageViewerOverlay). */
export const useImageViewerStore = create<ImageViewerState>((set) => ({
  uri: null,
  open: (uri) => set({ uri }),
  close: () => set({ uri: null }),
}));
