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
    if (!container) return;
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
    if (!chart) return;
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
    if (!pie) return;

    pie.innerHTML = `
      <div class="pie" style="--slice-success:${successSlice}deg; --slice-warning:${warningSlice}deg;">
        <div class="pie__label">${totalPOs ? `${Math.round((poSavings / totalPOs) * 100)}%` : '0%'}</div>
      </div>
      <p class="muted" style="text-align:center; margin-top:0.75rem;">${poSavings} saving · ${poNoSavings} flat · ${poOverspend} overspend</p>
    `;
  };

  const renderTable = () => {
    const container = document.getElementById('recentTable');
    if (!container) return;
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

  const renderAnalysis = () => {
    const cardsHost = document.getElementById('analysisCards');
    const tableHost = document.getElementById('analysisTable');
    if (!cardsHost || !tableHost) return;

    const summary = AppStore.getSummary();
    cardsHost.innerHTML = `
      <div class="card">
        <p class="eyebrow">PO Savings</p>
        <h3>${summary.savingsPercent || 0}%</h3>
        <p class="trend">POs with positive savings</p>
      </div>
      <div class="card">
        <p class="eyebrow">No Savings</p>
        <h3>${summary.poNoSavings}</h3>
        <p class="trend">POs flat against budget</p>
      </div>
      <div class="card">
        <p class="eyebrow">Overspend</p>
        <h3>${summary.poOverspend}</h3>
        <p class="trend">POs above approved budget</p>
      </div>
      <div class="card">
        <p class="eyebrow">Avg Savings</p>
        <h3>${AppUtils.formatPercent(summary.avgBudgetSavings)}</h3>
        <p class="trend">Average across all PRs</p>
      </div>
    `;

    const yearly = AppStore.getYearlyStats();
    const rows = Object.keys(yearly).sort().map(year => {
      const stats = yearly[year];
      const avgSaving = stats.count ? stats.totalBudgetSavings / stats.count : 0;
      const poCoverage = stats.count ? Math.round((stats.totalPOs / stats.count) * 100) : 0;
      const savingsRate = stats.totalPOs ? Math.round((stats.poSavings / stats.totalPOs) * 100) : 0;
      return `
        <div class="row">
          <div>${year}</div>
          <div>${stats.count}</div>
          <div>${stats.totalPOs}</div>
          <div>${poCoverage}%</div>
          <div>${AppUtils.formatPercent(avgSaving)}</div>
          <div>${savingsRate}%</div>
        </div>
      `;
    }).join('');

    tableHost.innerHTML = `
      <div class="row header">
        <div>Year</div>
        <div>PRs</div>
        <div>POs</div>
        <div>PO Coverage</div>
        <div>Avg Budget Savings</div>
        <div>POs w/ Savings</div>
      </div>
      ${rows || '<div class="row"><div class="muted" style="grid-column: span 6;">No data yet</div></div>'}
    `;
  };

  const renderAll = () => {
    renderCards();
    renderTrend();
    renderPie();
    renderTable();
    renderAnalysis();
  };

  window.Dashboard = { renderAll };
})();
