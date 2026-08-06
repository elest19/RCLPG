export function getSalesLogBalancePaid({ paymentOption, initialCreditBalancePaid = 0, fallbackBalancePaid = 0 }) {
  if (String(paymentOption || '').toLowerCase() === 'credit') {
    return 0;
  }

  return Number(fallbackBalancePaid || 0);
}
