import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { CardIcon, PhoneIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";

export type MobileOperator = "orange" | "wave" | "mtn";

const OPERATORS: { value: MobileOperator; label: string }[] = [
  { value: "orange", label: "Orange Money" },
  { value: "wave", label: "Wave" },
  { value: "mtn", label: "MTN Money" },
];

export type PaymentSubmission =
  | { method: "mobile_money"; operator: MobileOperator; phone_number: string }
  | { method: "bank_card"; card_number: string; card_holder_name: string };

/** Formulaire de règlement partagé — Mobile Money (opérateur + numéro) ou
 * carte bancaire (fictive, environnement de test : aucune intégration
 * réelle, voir apps.payments.services côté backend). Utilisé partout où
 * un règlement est nécessaire (facture établissement, formation,
 * rattrapage...) pour ne jamais dupliquer cette UI. */
export function PaymentMethodForm({
  onSubmit,
  loading,
  submitLabel = "Payer",
}: {
  onSubmit: (payload: PaymentSubmission) => void;
  loading?: boolean;
  submitLabel?: string;
}) {
  const [method, setMethod] = useState<"mobile_money" | "bank_card">("mobile_money");
  const [operator, setOperator] = useState<MobileOperator>("orange");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  const canSubmit =
    method === "mobile_money" ? phone.trim().length >= 8 : cardNumber.trim().length >= 12 && cardHolder.trim().length > 0;

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setMethod("mobile_money")}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
            method === "mobile_money" ? "bg-xporadia-navy" : "bg-xporadia-bg"
          }`}
        >
          <PhoneIcon size={15} color={method === "mobile_money" ? "#FFFFFF" : Colors.textSecondary} />
          <Text className={`text-xs font-semibold ${method === "mobile_money" ? "text-white" : "text-xporadia-text-secondary"}`}>
            Mobile Money
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMethod("bank_card")}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
            method === "bank_card" ? "bg-xporadia-navy" : "bg-xporadia-bg"
          }`}
        >
          <CardIcon size={15} color={method === "bank_card" ? "#FFFFFF" : Colors.textSecondary} />
          <Text className={`text-xs font-semibold ${method === "bank_card" ? "text-white" : "text-xporadia-text-secondary"}`}>
            Carte bancaire
          </Text>
        </Pressable>
      </View>

      {method === "mobile_money" ? (
        <View className="gap-3">
          <View className="flex-row gap-2">
            {OPERATORS.map((op) => (
              <Pressable
                key={op.value}
                onPress={() => setOperator(op.value)}
                className={`flex-1 rounded-xl py-2.5 items-center ${
                  operator === op.value ? "bg-xporadia-orange/10 border border-xporadia-orange" : "bg-xporadia-bg"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    operator === op.value ? "text-xporadia-orange-text" : "text-xporadia-text-secondary"
                  }`}
                >
                  {op.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input
            label="Numéro de téléphone"
            value={phone}
            onChangeText={setPhone}
            placeholder="07 00 00 00 00"
            keyboardType="phone-pad"
          />
        </View>
      ) : (
        <View className="gap-3">
          <Input
            label="Numéro de carte"
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="4111 1111 1111 1234"
            keyboardType="number-pad"
          />
          <Input label="Nom du titulaire" value={cardHolder} onChangeText={setCardHolder} placeholder="Nom complet" />
          <Text className="text-[11px] text-xporadia-text-secondary">
            Environnement de test — aucune vraie carte n&apos;est débitée.
          </Text>
        </View>
      )}

      <Button
        label={submitLabel}
        pill
        disabled={!canSubmit || loading}
        loading={loading}
        onPress={() =>
          onSubmit(
            method === "mobile_money"
              ? { method, operator, phone_number: phone.trim() }
              : { method, card_number: cardNumber.trim(), card_holder_name: cardHolder.trim() }
          )
        }
      />
    </View>
  );
}
