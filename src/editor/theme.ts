export function updateDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  localStorage.setItem("dark-mode", isDark.toString());
}

export function isDarkModeEnabled(): boolean {
  const storedDarkMode = localStorage.getItem("dark-mode");
  if (storedDarkMode === "true") {
    return true;
  }

  if (storedDarkMode === "false") {
    return false;
  }

  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  return systemPrefersDark;
}
