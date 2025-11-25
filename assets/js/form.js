(function() {
  const years = AppStore.settings.years || [2024];
  const fillSelect = (select, preview, prefix) => {
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

  const form = document.getElementById('prForm');
  const budgetEl = document.getElementById('budgetSavings');
  const submissionEl = document.getElementById('submissionSavings');

  const computePreview = () => {
    const budget = parseFloat(document.getElementById('approvedBudget').value) || 0;
    const first = parseFloat(document.getElementById('firstSubmission').value) || 0;
    const final = parseFloat(document.getElementById('finalPrice').value) || 0;
    const budgetPct = budget ? ((budget - final) / budget) * 100 : 0;
    const submissionPct = first ? ((first - final) / first) * 100 : 0;
    budgetEl.textContent = `${budgetPct.toFixed(1)}%`;
    submissionEl.textContent = `${submissionPct.toFixed(1)}%`;
  };

  form.addEventListener('input', computePreview);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const prDigits = document.getElementById('prNumber').value.trim();
    if (!/^[0-9]{6}$/.test(prDigits)) {
      alert('PR number must be six digits.');
      return;
    }

    const negDigits = document.getElementById('negNumber').value.trim();
    const poDigits = document.getElementById('poNumber').value.trim();

    const payload = {
      prNumber: `PR-${prYear.value}-${prDigits}`,
      negotiationNumber: negDigits ? `GCAA-${negYear.value}-${negDigits}` : '',
      poNumber: poDigits ? `PO-${poYear.value}-${poDigits}` : '',
      approvedBudget: parseFloat(document.getElementById('approvedBudget').value),
      firstSubmission: parseFloat(document.getElementById('firstSubmission').value),
      finalPrice: parseFloat(document.getElementById('finalPrice').value),
      hasPO: document.getElementById('hasPO').checked || Boolean(poDigits)
    };

    AppStore.addPR(payload);
    alert('PR saved! Return to the dashboard to see it reflected.');
    form.reset();
    computePreview();
  });

  computePreview();
})();
