import { createContext, useContext, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
} from "react-native";

/**
 * Alternative maison à react-native-keyboard-controller (retiré : son
 * intégration plante le rendu web avec "PromiseResolve called on
 * non-object", un risque qu'on ne peut pas se permettre juste avant une
 * démo, sans pouvoir vérifier sur un vrai appareil Android depuis ce
 * sandbox). Combine le KeyboardAvoidingView natif (comportement "height" sur
 * Android confirmé sans double-compensation : voir la doc RN — le calcul de
 * hauteur se base uniquement sur la position du clavier et le layout mesuré,
 * indépendamment de android:windowSoftInputMode) avec le défilement manuel
 * vers le champ actif, via l'API historique de ScrollView
 * (scrollResponderScrollNativeHandleToKeyboard) que Input.tsx déclenche à
 * chaque focus via le contexte exposé ici.
 */
const ScrollToFocusedInputContext = createContext<
  ((nodeHandle: number, extraOffset?: number) => void) | null
>(null);

export function useScrollToFocusedInput() {
  return useContext(ScrollToFocusedInputContext);
}

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  bottomOffset?: number;
}

export function KeyboardAwareScrollView({
  children,
  className,
  bottomOffset = 24,
  keyboardShouldPersistTaps,
  ...rest
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);

  const scrollToFocusedInput = (nodeHandle: number, extraOffset?: number) => {
    scrollRef.current
      ?.getScrollResponder()
      ?.scrollResponderScrollNativeHandleToKeyboard(
        nodeHandle,
        extraOffset ?? bottomOffset,
        true,
      );
  };

  return (
    <KeyboardAvoidingView
      className={className}
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? "handled"}
        {...rest}
      >
        <ScrollToFocusedInputContext.Provider value={scrollToFocusedInput}>
          {children}
        </ScrollToFocusedInputContext.Provider>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
