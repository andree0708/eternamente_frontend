import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'eternamente_theme';
const HC_KEY = 'eternamente_hc';
const FONT_KEY = 'eternamente_font_scale';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScaleState] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') setTheme(saved);
    setHighContrast(localStorage.getItem(HC_KEY) === '1');
    const fs = parseFloat(localStorage.getItem(FONT_KEY) || '1');
    if (!Number.isNaN(fs)) setFontScaleState(fs);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-hc', highContrast ? 'true' : 'false');
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
    document.documentElement.style.fontSize = `calc(1rem * ${fontScale})`;
    localStorage.setItem(STORAGE_KEY, theme);
    localStorage.setItem(HC_KEY, highContrast ? '1' : '0');
    localStorage.setItem(FONT_KEY, String(fontScale));
  }, [theme, highContrast, fontScale]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  const toggleHighContrast = () => setHighContrast((h) => !h);
  const setFontScale = (scale: number) => setFontScaleState(scale);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, highContrast, toggleHighContrast, fontScale, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme dentro de ThemeProvider');
  return ctx;
}
