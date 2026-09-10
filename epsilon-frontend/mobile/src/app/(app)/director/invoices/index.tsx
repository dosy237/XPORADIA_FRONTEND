import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { PaymentMethodForm } from "@/components/payments/PaymentMethodForm";
import type { PaymentSubmission } from "@/components/payments/PaymentMethodForm";
import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, ReceiptIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";
import type { EstablishmentInvoice } from "@/services/employment";

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function InvoiceCard({ invoice }: { invoice: EstablishmentInvoice }) {
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);

  const payMutation = useMutation({
    mutationFn: (payload: PaymentSubmission) => employmentApi.payInvoice(invoice.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invoices"] });
      setPaying(false);
    },
    onError: () => Alert.alert("Erreur", "Le règlement a échoué. Vérifiez les informations saisies."),
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-semibold text-xporadia-text-primary">
            {MONTH_LABELS[invoice.period_month - 1]} {invoice.period_year}
          </Text>
          <Text className="text-xs text-xporadia-text-secondary">
            Heures de vos enseignants (CDD, Vacation, Intérim)
          </Text>
        </View>
        <Chip
          label={invoice.status === "paid" ? "Payée" : "Non payée"}
          variant={invoice.status === "paid" ? "navy-subtle" : "orange"}
        />
      </View>

      <View className="flex-row items-baseline justify-between border-t border-xporadia-border pt-3">
        <Text className="text-xs text-xporadia-text-secondary">Montant dû</Text>
        <Text className="text-lg font-bold text-xporadia-navy">
          {invoice.total_amount.toLocaleString("fr-FR")} FCFA
        </Text>
      </View>

      {invoice.status === "unpaid" &&
        (paying ? (
          <PaymentMethodForm
            submitLabel={`Régler ${invoice.total_amount.toLocaleString("fr-FR")} FCFA`}
            loading={payMutation.isPending}
            onSubmit={(payload) => payMutation.mutate(payload)}
          />
        ) : (
          <Text
            className="text-xs font-semibold text-xporadia-orange-text text-center py-1"
            onPress={() => setPaying(true)}
            suppressHighlighting
          >
            Régler cette facture
          </Text>
        ))}
    </View>
  );
}

export default function InvoicesScreen() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["my-invoices"],
    queryFn: employmentApi.fetchMyInvoices,
  });

  const unpaid = (invoices ?? []).filter((i) => i.status === "unpaid");
  const paid = (invoices ?? []).filter((i) => i.status === "paid");

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Factures</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Générées automatiquement chaque mois, calculées sur les heures validées de vos
          enseignants.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : !invoices || invoices.length === 0 ? (
        <View className="items-center gap-2 py-10">
          <ReceiptIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary text-center">
            Aucune facture pour l&apos;instant.
          </Text>
        </View>
      ) : (
        <>
          {unpaid.length > 0 && (
            <View className="gap-3">
              {unpaid.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </View>
          )}
          {paid.length > 0 && (
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <CheckCircleIcon size={14} color={Colors.textSecondary} />
                <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                  Historique réglé
                </Text>
              </View>
              {paid.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
