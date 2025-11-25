(function() {
  const views = document.querySelectorAll('.view');
  const navButtons = document.querySelectorAll('[data-route]');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const snapshotBtn = document.getElementById('snapshotBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  const form = document.getElementById('prForm');
  const formTitle = document.getElementById('formTitle');
  const formSubmit = document.getElementById('formSubmit');
  const budgetEl = document.getElementById('budgetSavings');
  const submissionEl = document.getElementById('submissionSavings');
  const poInput = document.getElementById('poNumber');
  const hasPOCheckbox = document.getElementById('hasPO');
  const prTable = document.getElementById('prTable');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');

  const years = AppStore.settings.years || [AppStore.config.defaultYear || new Date().getFullYear()];
  let editingIndex = null;

  const fillSelect = (select, preview) => {
    if (!select || !preview) return;
    select.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    select.value = AppStore.config.defaultYear || years[0];
    preview.textContent = select.value;
    select.addEventListener('change', () => preview.textContent = select.value);
  };

  const prYear = document.getElementById('prYear');
  const negYear = document.getElementById('negYear');
  const poYear = document.getElementById('poYear');
  fillSelect(prYear, document.getElementById('prYearPreview'));
  fillSelect(negYear, document.getElementById('negYearPreview'));
  fillSelect(poYear, document.getElementById('poYearPreview'));

  const setRoute = (route) => {
    views.forEach(view => view.classList.toggle('hidden', view.dataset.view !== route));
    navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.route === route));
    if (route === 'dashboard') {
      pageTitle.textContent = 'Savings Dashboard';
      pageSubtitle.textContent = 'Track PR volumes, PO coverage, and your negotiated savings at a glance.';
    } else if (route === 'prs') {
      pageTitle.textContent = 'PR & PO Records';
      pageSubtitle.textContent = 'Add, edit, import/export PRs and instantly preview savings.';
    } else if (route === 'analysis') {
      pageTitle.textContent = 'Analysis';
      pageSubtitle.textContent = 'Year over year performance and coverage insights.';
    }
  };

  navButtons.forEach(btn => btn.addEventListener('click', (e) => {
    const route = btn.dataset.route;
    if (btn.tagName === 'BUTTON') e.preventDefault();
    setRoute(route);
  }));

  const computePreview = () => {
    const budget = parseFloat(document.getElementById('approvedBudget').value) || 0;
    const first = parseFloat(document.getElementById('firstSubmission').value) || 0;
    const final = parseFloat(document.getElementById('finalPrice').value) || 0;
    const budgetPct = AppUtils.computeSavingsBudget(budget, final);
    const submissionPct = AppUtils.computeSavingsSubmission(first, final);
    budgetEl.textContent = AppUtils.formatPercent(budgetPct);
    submissionEl.textContent = AppUtils.formatPercent(submissionPct);
  };

  const resetForm = () => {
    form.reset();
    [prYear, negYear, poYear].forEach(sel => { if (sel) sel.value = AppStore.config.defaultYear || years[0]; });
    document.getElementById('prYearPreview').textContent = prYear.value;
    document.getElementById('negYearPreview').textContent = negYear.value;
    document.getElementById('poYearPreview').textContent = poYear.value;
    editingIndex = null;
    formTitle.textContent = 'Add PR';
    formSubmit.textContent = 'Save PR';
    computePreview();
  };

  const buildPayload = () => {
    const prDigits = document.getElementById('prNumber').value.trim();
    if (!/^[0-9]{6}$/.test(prDigits)) {
      alert('PR number must be six digits.');
      return null;
    }
    const negDigits = document.getElementById('negNumber').value.trim();
    const poDigits = document.getElementById('poNumber').value.trim();

    return {
      prNumber: `PR-${prYear.value}-${prDigits}`,
      negotiationNumber: negDigits ? `GCAA-${negYear.value}-${negDigits}` : '',
      poNumber: poDigits ? `PO-${poYear.value}-${poDigits}` : '',
      approvedBudget: parseFloat(document.getElementById('approvedBudget').value),
      firstSubmission: parseFloat(document.getElementById('firstSubmission').value),
      finalPrice: parseFloat(document.getElementById('finalPrice').value),
      hasPO: document.getElementById('hasPO').checked || Boolean(poDigits)
    };
  };

  form?.addEventListener('input', (event) => {
    if (event.target === poInput && poInput.value.trim()) {
      hasPOCheckbox.checked = true;
    }
    computePreview();
  });

  form?.addEventListener('reset', () => setTimeout(resetForm, 0));

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    if (editingIndex !== null) {
      AppStore.updatePR(editingIndex, payload);
    } else {
      AppStore.addPR(payload);
    }

    Dashboard.renderAll();
    renderPRTable();
    resetForm();
    setRoute('dashboard');
  });

  const parseNumberParts = (value = '') => {
    const parts = value.split('-');
    return { year: parts[1] || (AppStore.config.defaultYear || years[0]), digits: parts[2] || '' };
  };

  const handleEdit = (index) => {
    const pr = AppStore.prs[index];
    if (!pr) return;
    editingIndex = index;
    formTitle.textContent = `Edit ${pr.prNumber}`;
    formSubmit.textContent = 'Update PR';

    const prParts = parseNumberParts(pr.prNumber);
    prYear.value = prParts.year;
    document.getElementById('prNumber').value = prParts.digits;
    document.getElementById('prYearPreview').textContent = prYear.value;

    const negParts = parseNumberParts(pr.negotiationNumber || `-${negYear.value}-`);
    negYear.value = negParts.year;
    document.getElementById('negNumber').value = negParts.digits;
    document.getElementById('negYearPreview').textContent = negYear.value;

    const poParts = parseNumberParts(pr.poNumber || `-${poYear.value}-`);
    poYear.value = poParts.year;
    document.getElementById('poNumber').value = poParts.digits;
    document.getElementById('poYearPreview').textContent = poYear.value;

    document.getElementById('approvedBudget').value = pr.approvedBudget;
    document.getElementById('firstSubmission').value = pr.firstSubmission;
    document.getElementById('finalPrice').value = pr.finalPrice;
    document.getElementById('hasPO').checked = pr.hasPO;

    computePreview();
    setRoute('prs');
  };

  const renderPRTable = () => {
    if (!prTable) return;
    if (!AppStore.prs.length) {
      prTable.innerHTML = '<div class="row"><div class="muted" style="grid-column: span 4;">No PRs yet. Add one to begin tracking.</div></div>';
      return;
    }

    prTable.innerHTML = `
      <div class="row header">
        <div>PR</div><div>PO</div><div>Savings</div><div>Actions</div>
      </div>
      ${AppStore.prs.map((pr, index) => {
        const budget = AppUtils.computeSavingsBudget(pr.approvedBudget, pr.finalPrice);
        const submission = AppUtils.computeSavingsSubmission(pr.firstSubmission, pr.finalPrice);
        return `
          <div class="row">
            <div>
              <strong>${pr.prNumber}</strong><br />
              <span class="muted">${pr.negotiationNumber || '—'}</span>
            </div>
            <div>${pr.poNumber || '—'}</div>
            <div>
              <div>${AppUtils.formatPercent(budget)} vs budget</div>
              <div class="muted">${AppUtils.formatPercent(submission)} vs submission</div>
            </div>
            <div class="actions">
              <button class="icon-btn" aria-label="Edit" data-action="edit" data-index="${index}">✏️</button>
              <button class="icon-btn danger" aria-label="Delete" data-action="delete" data-index="${index}">🗑️</button>
            </div>
          </div>
        `;
      }).join('')}
    `;
  };

  prTable?.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const index = Number(target.dataset.index);
    if (target.dataset.action === 'edit') {
      handleEdit(index);
    } else if (target.dataset.action === 'delete') {
      if (confirm('Delete this PR?')) {
        AppStore.deletePR(index);
        Dashboard.renderAll();
        renderPRTable();
      }
    }
  });

  exportBtn?.addEventListener('click', () => {
    const csv = AppUtils.toCSV(AppStore.prs);
    AppUtils.downloadFile('pr-records.csv', csv);
  });

  importInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const rows = AppUtils.parseCSV(text);
        if (!rows.length) return alert('No records found in file');
        AppStore.replacePRs(rows);
        Dashboard.renderAll();
        renderPRTable();
      } catch (err) {
        alert('Unable to import file. Please use CSV exported from the dashboard.');
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  });

  snapshotBtn?.addEventListener('click', async () => {
    const activeView = document.querySelector('.view:not(.hidden)');
    if (!activeView || !window.html2canvas) return;
    const canvas = await window.html2canvas(activeView);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dashboard-snapshot.png';
      link.click();
      URL.revokeObjectURL(url);
    });
  });

  refreshBtn?.addEventListener('click', () => {
    Dashboard.renderAll();
    renderPRTable();
  });

  computePreview();
  resetForm();
  renderPRTable();
  Dashboard.renderAll();
})();
