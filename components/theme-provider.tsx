"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "ppe-theme";

function applyThemeToDocument(theme: Theme) {
  // Comentário em pt-BR: aplica ou remove a classe `dark` no elemento raiz
  if (typeof document === "undefined") return;

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Comentário em pt-BR: garante que rodamos apenas no cliente
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Comentário em pt-BR: tenta ler o tema salvo, senão usa prefers-color-scheme
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as
      | Theme
      | null;

    if (storedTheme === "dark" || storedTheme === "light") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(storedTheme);
      applyThemeToDocument(storedTheme);
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme: Theme = prefersDark ? "dark" : "light";

    setTheme(initialTheme);
    applyThemeToDocument(initialTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, initialTheme);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    applyThemeToDocument(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, isMounted]);

  const toggleTheme = useCallback(() => {
    // Comentário em pt-BR: alterna entre tema claro e escuro
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div data-theme-ready={isMounted ? "true" : "false"}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return ctx;
}


