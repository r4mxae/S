(function() {
  const renderCards = () => {
    const summary = AppStore.getSummary();
    const cards = [
      { label: 'Total PRs', value: summary.totalPRs, trend: 'Active procurement records' },
      { label: `Total Value (${AppStore.config.currency})`, value: AppUtils.formatCurrency(summary.totalValue, AppStore.config.currency), trend: 'Sum of final negotiated amounts' },
      { label: 'PO Coverage', value: `${summary.poCoverage}%`, trend: `${summary.totalPOs} of ${summary.totalPRs || 0} PRs have POs` },
      { label: 'Avg Budget Savings', value: AppUtils.formatPercent(summary.avgBudgetSavings), trend: `${summary.poNoSavings} no-savings · ${summary.poOverspend} overspend` }
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
    const rows = AppStore.getTrendRows();
    if (!rows.length) {
      chart.innerHTML = '<p class="muted">No PRs yet. Add PRs to see savings trend.</p>';
      return;
    }

    const values = rows.flatMap(r => [Math.abs(r.budget), Math.abs(r.submission)]);
    const maxAbs = Math.max(...values, 1);

    chart.innerHTML = `
      <div class="bar-chart">
        ${rows.map(row => {
          const budgetHeight = (Math.abs(row.budget) / maxAbs) * 100;
          const submissionHeight = (Math.abs(row.submission) / maxAbs) * 100;
          const budgetClass = row.budget < 0 ? 'bar--negative' : '';
          const submissionClass = row.submission < 0 ? 'bar--negative' : 'bar--accent';
          return `
            <div class="bar-stack">
              <div class="bar ${budgetClass}" style="height:${Math.max(10, budgetHeight)}%">
                <span class="bar__label">${AppUtils.formatPercent(row.budget)}</span>
                <span class="bar__title">${row.title}</span>
              </div>
              <div class="bar ${submissionClass}" style="height:${Math.max(10, submissionHeight)}%">
                <span class="bar__label">${AppUtils.formatPercent(row.submission)}</span>
              </div>
            </div>
          `;
        }).join('')}
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
    const rows = AppStore.getRecent();
    container.innerHTML = `
      <div class="row header">
        <div>PR</div><div>PO</div><div>Budget vs Final</div><div>Submission vs Final</div><div>Status</div>
      </div>
      ${rows.map(pr => {
        const budget = AppUtils.computeSavingsBudget(pr.approvedBudget, pr.finalPrice);
        const submission = AppUtils.computeSavingsSubmission(pr.firstSubmission, pr.finalPrice);
        const badge = budget > 0 ? 'success' : budget === 0 ? 'warning' : 'danger';
        const badgeLabel = budget > 0 ? 'Savings' : budget === 0 ? 'No savings' : 'Overspend';
        return `
          <div class="row">
            <div>
              <strong>${pr.prNumber}</strong><br />
              <span class="muted">${pr.negotiationNumber || '—'}</span>
            </div>
            <div>${pr.poNumber || '—'}</div>
            <div>${AppUtils.formatPercent(budget)}</div>
            <div>${AppUtils.formatPercent(submission)}</div>
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
