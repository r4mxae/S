(function() {
  const getCurrencyFormatter = (currency) => new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency || 'AED',
    maximumFractionDigits: 0
  });

  const percentFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  });

  const formatPercent = (value) => `${percentFormatter.format(Number.isFinite(value) ? value : 0)}%`;
  const clampPercent = (value) => {
    if (!Number.isFinite(value)) return 0;
    return Math.min(999, Math.max(-100, value));
  };

  const computeSavingsBudget = (approvedBudget, finalPrice) => {
    const budget = Number(approvedBudget) || 0;
    const final = Number(finalPrice) || 0;
    if (!budget) return 0;
    return ((budget - final) / budget) * 100;
  };

  const computeSavingsSubmission = (firstSubmission, finalPrice) => {
    const first = Number(firstSubmission) || 0;
    const final = Number(finalPrice) || 0;
    if (!first) return 0;
    return ((first - final) / first) * 100;
  };

  window.AppUtils = {
    formatCurrency(value, currency) {
      return getCurrencyFormatter(currency).format(Number.isFinite(value) ? value : 0);
    },
    formatPercent,
    clampPercent,
    computeSavingsBudget,
    computeSavingsSubmission
  };
})();
