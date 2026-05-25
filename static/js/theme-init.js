(function () {
  const themeKey = 'td-color-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let storedTheme;

  try {
    storedTheme = localStorage.getItem(themeKey);
  } catch (_) {
    storedTheme = null;
  }

  let theme = storedTheme || (prefersDark ? 'dark' : 'light');

  if (theme === 'auto') {
    theme = prefersDark ? 'dark' : 'light';
  }

  document.documentElement.setAttribute('data-bs-theme', theme);
})();
