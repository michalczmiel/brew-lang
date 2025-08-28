export type ThemeOption = "light" | "dark" | "system";

export function updateTheme(theme: ThemeOption): void {
  if (theme === "system") {
    localStorage.removeItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (systemPrefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } else {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

export function getCurrentTheme(): ThemeOption {
  const storedTheme = localStorage.getItem("theme") as ThemeOption | null;
  return storedTheme || "system";
}

export function isDarkModeEnabled(): boolean {
  const theme = getCurrentTheme();
  if (theme === "dark") {
    return true;
  }
  if (theme === "light") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
