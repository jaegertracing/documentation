(function () {
  const themeKey = 'td-color-theme';
  const storedTheme = localStorage.getItem(themeKey);
  let theme =
    storedTheme ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light');

  if (theme === 'auto') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  document.documentElement.setAttribute('data-bs-theme', theme);
})();
