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
  totalCreditBalance = 0,
  fullyPaidCreditSalesRevenue = 0,
  fullyPaidCreditCostOfGoodsSold = 0,
} = {}) {
  const totalSalesRevenue = Number(totalRevenue || 0);
  const salesCostOfGoods = Number(costOfGoodsSold || 0);
  const fullyPaidSalesRevenue = Number(totalFullyPaidSales || 0);
  const fullyPaidSalesCostOfGoods = Number(totalFullyPaidCostOfGoodsSold || 0);
  const creditOnlySalesRevenue = Number(
    (fullyPaidCreditSalesRevenue || totalSalesRevenue - fullyPaidSalesRevenue || 0).toFixed(2),
  );
  const creditOnlyCostOfGoods = Number(
    (fullyPaidCreditCostOfGoodsSold || salesCostOfGoods - fullyPaidSalesCostOfGoods || 0).toFixed(2),
  );

  // Calculations
  const netIncomeFullyPaid = Number((fullyPaidSalesRevenue - (fullyPaidSalesCostOfGoods + totalExpenses)).toFixed(2)); // Fully Paid Net Income Formula
  const expectedNetIncome = Number((creditOnlySalesRevenue - (creditOnlyCostOfGoods + totalExpenses)).toFixed(2)); // Expected Credit Net Income Formula
  const netIncomeQualified = Number((netIncomeFullyPaid + expectedNetIncome).toFixed(2)); // Total Net Income Formula
  const creditBalance = Number(totalCreditBalance || 0); // Remaining Credit Balance

  return {
    totalSalesRevenue: totalSalesRevenue, // Total Sales Revenue
    //totalSalesRevenueFormula: `${formatCurrencyValue(fullyPaidSalesRevenue)} + ${formatCurrencyValue(qualifiedSales)}`,
    netIncomeFullyPaid, //Fully Paid Net Income
    netIncomeQualified, //Total Net Income
    expectedNetIncome,
    totalVolumeKg: Number(totalVolumeKg || 0), // Total Volume
    creditOnlySalesRevenue, // Credit-only sales revenue
    creditOnlyCostOfGoods, // Credit-only cost of goods

    //Cards
    netIncomeQualifiedFormula: `Fully Paid + Expected Credit Net Income`, // Total Net Income
    netIncomeFullyPaidFormula: `${formatCurrencyValue(fullyPaidSalesRevenue)} - (${formatCurrencyValue(fullyPaidSalesCostOfGoods)} + ${formatCurrencyValue(totalExpenses)})`, // Fully Paid Net Income
    expectedNetIncomeFormula: `${formatCurrencyValue(creditOnlySalesRevenue)} - (${formatCurrencyValue(creditOnlyCostOfGoods)} + ${formatCurrencyValue(totalExpenses)})`, // Expected Credit Net Income
    totalCreditBalance: creditBalance, // Remaining Credit Balance
    totalExpenses: Number(totalExpenses || 0), // Expenses
    totalOrders: Number(totalOrders || 0), // Total Orders
  };
}
