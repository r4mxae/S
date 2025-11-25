(function() {
  const formatCurrency = (value) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: AppStore.config.currency || 'AED', maximumFractionDigits: 0 }).format(value);

  const renderCards = () => {
    const summary = AppStore.getSummary();
    const cards = [
      { label: 'Total PRs', value: summary.totalPRs, trend: 'Active procurement records' },
      { label: `Total Value (${AppStore.config.currency})`, value: formatCurrency(summary.totalValue), trend: 'Sum of final negotiated' },
      { label: 'POs Issued', value: summary.totalPOs, trend: 'PRs converted to POs' },
      { label: 'PO Savings %', value: `${summary.savingsPercent}%`, trend: `${summary.poNoSavings} no-savings · ${summary.poOverspend} overspend` }
    ];

    const container = document.getElementById('summaryCards');
    container.innerHTML = cards.map(card => `
      <div class="card">
        <p class="eyebrow">${card.label}</p>
        <h3>${card.value}</h3>
        <p class="trend">${card.trend}</p>
      </div>
    `).join('');
  };

  const renderTrend = () => {
    const chart = document.getElementById('trendChart');
    const rows = AppStore.prs.slice(0, 6).map(pr => {
      const budget = Math.max(AppStore.savingsAgainstBudget(pr), -100);
      const submission = Math.max(AppStore.savingsAgainstSubmission(pr), -100);
      return { title: pr.prNumber, budget, submission };
    });

    const maxValue = Math.max(...rows.flatMap(r => [r.budget, r.submission, 0]));
    const factor = maxValue ? 100 / (maxValue + 20) : 1;

    chart.innerHTML = `
      <div class="bar-chart">
        ${rows.map(row => `
          <div style="flex:1; position:relative;">
            <div class="bar" style="height:${Math.max(10, (row.budget + 100) * factor)}%">
              <span class="bar__label">${row.budget.toFixed(1)}%</span>
              <span class="bar__title">${row.title}</span>
            </div>
            <div class="bar bar--accent" style="height:${Math.max(10, (row.submission + 100) * factor)}%">
              <span class="bar__label">${row.submission.toFixed(1)}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const renderPie = () => {
    const { poNoSavings, poOverspend, totalPOs } = AppStore.getSummary();
    const poSavings = Math.max(totalPOs - poNoSavings - poOverspend, 0);
    const successSlice = totalPOs ? (poSavings / totalPOs) * 360 : 0;
    const warningSlice = totalPOs ? (poNoSavings / totalPOs) * 360 : 0;
    const pie = document.getElementById('poChart');

    pie.innerHTML = `
      <div class="pie" style="--slice-success:${successSlice}deg; --slice-warning:${warningSlice}deg;">
        <div class="pie__label">${totalPOs ? `${Math.round((poSavings / totalPOs) * 100)}%` : '0%'}</div>
      </div>
      <p class="muted" style="text-align:center; margin-top:0.75rem;">${poSavings} saving · ${poNoSavings} flat · ${poOverspend} overspend</p>
    `;
  };

  const renderTable = () => {
    const container = document.getElementById('recentTable');
    const rows = AppStore.prs.slice(0, AppStore.config.dashboard?.recentLimit || 6);
    container.innerHTML = `
      <div class="row header">
        <div>PR</div><div>PO</div><div>Budget vs Final</div><div>Submission vs Final</div><div>Status</div>
      </div>
      ${rows.map(pr => {
        const budget = AppStore.savingsAgainstBudget(pr);
        const submission = AppStore.savingsAgainstSubmission(pr);
        const badge = budget > 0 ? 'success' : budget === 0 ? 'warning' : 'danger';
        const badgeLabel = budget > 0 ? 'Savings' : budget === 0 ? 'No savings' : 'Overspend';
        return `
          <div class="row">
            <div>
              <strong>${pr.prNumber}</strong><br />
              <span class="muted">${pr.negotiationNumber || '—'}</span>
            </div>
            <div>${pr.poNumber || '—'}</div>
            <div>${budget.toFixed(1)}%</div>
            <div>${submission.toFixed(1)}%</div>
            <div><span class="badge ${badge}">${badgeLabel}</span></div>
          </div>
        `;
      }).join('')}
    `;
  };

  const refresh = () => {
    renderCards();
    renderTrend();
    renderPie();
    renderTable();
  };

  document.getElementById('refreshBtn')?.addEventListener('click', refresh);
  refresh();
})();
