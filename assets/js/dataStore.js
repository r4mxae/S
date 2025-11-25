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
      return JSON.parse(fromStorage);
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

  savePreferences(prefs) {
    this.preferences = { ...this.preferences, ...prefs };
    localStorage.setItem(this.preferencesKey, JSON.stringify(this.preferences));
  }

  loadPRs() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    const initial = this.loadJSON('prs');
    localStorage.setItem(this.storageKey, JSON.stringify(initial));
    return initial;
  }

  addPR(record) {
    this.prs = [record, ...this.prs];
    localStorage.setItem(this.storageKey, JSON.stringify(this.prs));
  }

  getSummary() {
    const totalPRs = this.prs.length;
    const totalValue = this.prs.reduce((sum, pr) => sum + (pr.finalPrice || 0), 0);
    const totalPOs = this.prs.filter(pr => pr.hasPO && pr.poNumber).length;
    const poWithSavings = this.prs.filter(pr => pr.hasPO && pr.poNumber && this.savingsAgainstBudget(pr) > 0);
    const poNoSavings = this.prs.filter(pr => pr.hasPO && pr.poNumber && this.savingsAgainstBudget(pr) === 0);
    const poOverspend = this.prs.filter(pr => pr.hasPO && pr.poNumber && this.savingsAgainstBudget(pr) < 0);
    const savingsPercent = poWithSavings.length && totalPOs ? Math.round((poWithSavings.length / totalPOs) * 100) : 0;

    return { totalPRs, totalValue, totalPOs, savingsPercent, poNoSavings: poNoSavings.length, poOverspend: poOverspend.length };
  }

  savingsAgainstBudget(pr) {
    if (!pr.approvedBudget) return 0;
    return ((pr.approvedBudget - pr.finalPrice) / pr.approvedBudget) * 100;
  }

  savingsAgainstSubmission(pr) {
    if (!pr.firstSubmission) return 0;
    return ((pr.firstSubmission - pr.finalPrice) / pr.firstSubmission) * 100;
  }
}

window.AppStore = new DataStore();
