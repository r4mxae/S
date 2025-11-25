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

  const downloadFile = (filename, content, type = 'text/csv') => {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const toCSV = (items) => {
    const headers = ['prNumber','negotiationNumber','poNumber','approvedBudget','firstSubmission','finalPrice','hasPO','createdAt'];
    const lines = [headers.join(',')];
    items.forEach(item => {
      const row = headers.map(key => {
        const value = item[key] ?? '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',');
      lines.push(row);
    });
    return lines.join('\n');
  };

  const parseCSV = (text) => {
    const [headerLine, ...rows] = text.trim().split(/\r?\n/);
    const headers = headerLine.split(',').map(h => h.trim());
    return rows.filter(Boolean).map(line => {
      const cells = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = cells[i]);
      return obj;
    });
  };

  window.AppUtils = {
    formatCurrency(value, currency) {
      return getCurrencyFormatter(currency).format(Number.isFinite(value) ? value : 0);
    },
    formatPercent,
    clampPercent,
    computeSavingsBudget,
    computeSavingsSubmission,
    downloadFile,
    toCSV,
    parseCSV
  };
})();
