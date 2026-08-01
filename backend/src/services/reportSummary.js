function formatCurrencyValue(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function buildSalesReportSummary({
  totalRevenue = 0,
  costOfGoodsSold = 0,
  totalFullyPaidCostOfGoodsSold = 0,
  totalExpenses = 0,
  totalOrders = 0,
  totalVolumeKg = 0,
  totalFullyPaidSales = 0,
  fullyPaidCreditSalesRevenue = 0,
  fullyPaidCreditCostOfGoodsSold = 0,
  qualifiedSalesRevenue = 0,
  qualifiedCostOfGoodsSold = 0,
  totalCreditBalance = 0,
} = {}) {
  const totalSalesRevenue = Number(totalRevenue || 0);
  const salesCostOfGoods = Number(costOfGoodsSold || 0);
  const fullyPaidSalesRevenue = Number(totalFullyPaidSales || 0);
  const fullyPaidSalesCostOfGoods = Number(totalFullyPaidCostOfGoodsSold || 0);
  const fullyPaidCreditSales = Number(fullyPaidCreditSalesRevenue || 0);
  const fullyPaidCreditCogs = Number(fullyPaidCreditCostOfGoodsSold || 0);
  const qualifiedSales = Number(qualifiedSalesRevenue || 0);
  const qualifiedSalesCogs = Number(qualifiedCostOfGoodsSold || 0);
  const combinedCostOfGoodsSold = Number(
    (qualifiedSalesCogs > 0 ? qualifiedSalesCogs : fullyPaidSalesCostOfGoods + fullyPaidCreditCogs).toFixed(2),
  );
  const totalSalesDifference = Number((totalSalesRevenue - combinedCostOfGoodsSold).toFixed(2));
  const netIncome = Number((totalSalesRevenue - (salesCostOfGoods + totalExpenses)).toFixed(2));
  const netIncomeFullyPaid = Number((fullyPaidSalesRevenue - (fullyPaidSalesCostOfGoods + totalExpenses)).toFixed(2));
  const netIncomeCreditFullyPaid = Number((fullyPaidCreditSales - (fullyPaidCreditCogs + totalExpenses)).toFixed(2));
  const expectedNetIncome = Number((totalSalesRevenue - (salesCostOfGoods + totalExpenses)).toFixed(2));
  const netIncomeQualified = Number((netIncomeFullyPaid + expectedNetIncome).toFixed(2));
  const netIncomeWithoutCredit = Number((totalFullyPaidSales - (totalFullyPaidCostOfGoodsSold + totalExpenses)).toFixed(2));
  const creditBalance = Number(totalCreditBalance || 0);

  return {
    totalGrossRevenue: totalSalesRevenue,
    grossIncome: totalSalesRevenue,
    totalSalesRevenue: totalSalesRevenue,
    totalSalesRevenueFormula: `${formatCurrencyValue(totalSalesRevenue)}`,
    grossIncomeFormula: `${formatCurrencyValue(totalSalesRevenue)}`,
    netIncome,
    netIncomeFullyPaid,
    netIncomeCreditFullyPaid,
    netIncomeQualified,
    expectedNetIncome,
    netIncomeWithoutCredit,
    totalCreditBalance: creditBalance,
    totalExpenses: Number(totalExpenses || 0),
    costOfGoodsSold: combinedCostOfGoodsSold,
    totalVolumeKg: Number(totalVolumeKg || 0),
    totalOrders: Number(totalOrders || 0),
    averageOrderValue:
      Number(totalOrders || 0) > 0
        ? Number((totalSalesRevenue / Number(totalOrders || 0)).toFixed(2))
        : 0,
    netIncomeFormula: `${formatCurrencyValue(totalSalesRevenue)} - (${formatCurrencyValue(salesCostOfGoods)} + ${formatCurrencyValue(totalExpenses)})`,
    netIncomeFullyPaidFormula: `${formatCurrencyValue(fullyPaidSalesRevenue)} - (${formatCurrencyValue(fullyPaidSalesCostOfGoods)} + ${formatCurrencyValue(totalExpenses)})`,
    netIncomeCreditFullyPaidFormula: `${formatCurrencyValue(fullyPaidCreditSales)} - (${formatCurrencyValue(fullyPaidCreditCogs)} + ${formatCurrencyValue(totalExpenses)})`,
    netIncomeQualifiedFormula: `Fully Paid + Expected Credit Net Income`,
    expectedNetIncomeFormula: `${formatCurrencyValue(totalSalesRevenue)} - (${formatCurrencyValue(salesCostOfGoods)} + ${formatCurrencyValue(totalExpenses)})`,
    netIncomeWithoutCreditFormula: `${formatCurrencyValue(totalFullyPaidSales)} - (${formatCurrencyValue(totalFullyPaidCostOfGoodsSold)} + ${formatCurrencyValue(totalExpenses)})`,
    totalCreditBalanceFormula: `${formatCurrencyValue(creditBalance)}`,
  };
}
