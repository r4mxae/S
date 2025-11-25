(function() {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const sidebar = document.querySelector('.sidebar');

  const storedTheme = AppStore.preferences.theme || 'light';
  root.setAttribute('data-theme', storedTheme);
  if (toggle) toggle.checked = storedTheme === 'dark';

  toggle?.addEventListener('change', () => {
    const next = toggle.checked ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    AppStore.savePreferences({ theme: next });
  });

  collapseBtn?.addEventListener('click', () => {
    const collapsed = sidebar.getAttribute('data-collapsed') === 'true';
    sidebar.setAttribute('data-collapsed', (!collapsed).toString());
    AppStore.settings.sidebarCollapsed = !collapsed;
    localStorage.setItem('pr-dashboard-settings', JSON.stringify(AppStore.settings));
  });

  const collapsed = AppStore.settings.sidebarCollapsed;
  if (typeof collapsed === 'boolean') {
    sidebar?.setAttribute('data-collapsed', collapsed.toString());
  }
})();
