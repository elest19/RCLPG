import { formatCurrency } from "../api/client";

export function getSalesEntrySummary(sale) {
  const isPaymentEntry = sale.entry_type === "payment";
  const paymentOption = sale.payment_option || (isPaymentEntry ? "Credit" : "Fully Paid");
  const isCreditSale = paymentOption === "Credit";
  const isFullyPaidSale = paymentOption === "Fully Paid";

  let balancePaidValue = 0;
  if (isPaymentEntry) {
    balancePaidValue = Number(sale.balance_paid || 0);
  } else if (isFullyPaidSale) {
    balancePaidValue = Number(sale.total_amount || 0);
  } else if (isCreditSale) {
    balancePaidValue = Number(sale.balance_paid || 0);
  }

  return {
    typeLabel: isPaymentEntry ? "Credit Payment" : paymentOption,
    balancePaidValue,
    balancePaidLabel: formatCurrency(balancePaidValue),
    remainingBalance: Number(sale.remaining_balance || 0),
    isCreditSale,
    isFullyPaidSale,
  };
}
