class DataStore {
  constructor() {
    this.storageKey = 'pr-dashboard-data';
    this.preferencesKey = 'pr-dashboard-preferences';
    this.config = this.loadJSON('config');
    this.settings = this.loadSettings();
    this.preferences = this.loadPreferences();
    this.prs = this.loadPRs();
  }

  loadJSON(name) {
    try {
      const inline = document.getElementById(`inline-${name}`);
      if (inline) {
        return JSON.parse(inline.textContent);
      }
    } catch (err) {
      console.warn(`Inline ${name} failed`, err);
    }

    try {
      const request = new XMLHttpRequest();
      request.open('GET', `data/${name}.json`, false);
      request.send(null);
      if (request.status >= 200 && request.status < 400) {
        return JSON.parse(request.responseText);
      }
    } catch (err) {
      console.warn(`Fallback to defaults for ${name}`, err);
    }

    return {};
  }

  loadPreferences() {
    const fromStorage = localStorage.getItem(this.preferencesKey);
    if (fromStorage) {
      try { return JSON.parse(fromStorage); } catch (err) {}
    }
    const prefs = this.loadJSON('preferences');
    localStorage.setItem(this.preferencesKey, JSON.stringify(prefs));
    return prefs;
  }

  loadSettings() {
    const saved = localStorage.getItem('pr-dashboard-settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (err) {}
    }
    const defaults = this.loadJSON('settings');
    localStorage.setItem('pr-dashboard-settings', JSON.stringify(defaults));
    return defaults;
  }

  normalizePR(record) {
    return {
      prNumber: record.prNumber || '',
      negotiationNumber: record.negotiationNumber || '',
      poNumber: record.poNumber || '',
      approvedBudget: Number(record.approvedBudget) || 0,
      firstSubmission: Number(record.firstSubmission) || 0,
      finalPrice: Number(record.finalPrice) || 0,
      hasPO: Boolean(record.hasPO) || Boolean(record.poNumber),
      createdAt: record.createdAt || new Date().toISOString()
    };
  }

  loadPRs() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try { return JSON.parse(saved).map(pr => this.normalizePR(pr)); } catch (err) {}
    }
    const initial = this.loadJSON('prs');
    const normalized = Array.isArray(initial) ? initial.map(pr => this.normalizePR(pr)) : [];
    localStorage.setItem(this.storageKey, JSON.stringify(normalized));
    return normalized;
  }

  addPR(record) {
    const pr = this.normalizePR(record);
    this.prs = [pr, ...this.prs];
    localStorage.setItem(this.storageKey, JSON.stringify(this.prs));
  }

  getSummary() {
    const totals = this.prs.reduce((acc, pr) => {
      const budgetSavings = AppUtils.computeSavingsBudget(pr.approvedBudget, pr.finalPrice);
      acc.totalValue += pr.finalPrice || 0;
      acc.totalBudgetSavings += budgetSavings;

      if (pr.hasPO && pr.poNumber) {
        acc.totalPOs += 1;
        if (budgetSavings > 0) acc.poWithSavings += 1;
        if (budgetSavings === 0) acc.poNoSavings += 1;
        if (budgetSavings < 0) acc.poOverspend += 1;
      }
      return acc;
    }, { totalValue: 0, totalBudgetSavings: 0, totalPOs: 0, poWithSavings: 0, poNoSavings: 0, poOverspend: 0 });

    const totalPRs = this.prs.length;
    const avgBudgetSavings = totalPRs ? totals.totalBudgetSavings / totalPRs : 0;
    const poCoverage = totalPRs ? Math.round((totals.totalPOs / totalPRs) * 100) : 0;
    const savingsPercent = totals.totalPOs ? Math.round((totals.poWithSavings / totals.totalPOs) * 100) : 0;

    return {
      totalPRs,
      totalValue: totals.totalValue,
      totalPOs: totals.totalPOs,
      savingsPercent,
      poNoSavings: totals.poNoSavings,
      poOverspend: totals.poOverspend,
      poCoverage,
      avgBudgetSavings
    };
  }

  getTrendRows(limit = 6) {
    const rows = this.prs.slice(0, limit).map(pr => ({
      title: pr.prNumber,
      budget: AppUtils.computeSavingsBudget(pr.approvedBudget, pr.finalPrice),
      submission: AppUtils.computeSavingsSubmission(pr.firstSubmission, pr.finalPrice)
    }));
    return rows;
  }

  getRecent(limit = this.config.dashboard?.recentLimit || 6) {
    return this.prs.slice(0, limit);
  }
}

window.AppStore = new DataStore();
