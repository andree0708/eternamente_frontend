import type { ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import '../../styles/shell.css';

interface Props {
  children: ReactNode;
  active: 'home' | 'games' | 'history' | 'settings';
}

const NAV = [
  { id: 'home' as const, href: '/games', label: 'Inicio', icon: '🏠' },
  { id: 'games' as const, href: '/games#juegos', label: 'Juegos', icon: '🎮' },
  { id: 'history' as const, href: '/history', label: 'Historial', icon: '📊' },
  { id: 'settings' as const, href: '/games#ajustes', label: 'Ajustes', icon: '⚙️' },
];

export function AppShell({ children, active }: Props) {
  const { theme, toggleTheme, highContrast, toggleHighContrast, fontScale, setFontScale } = useTheme();

  return (
    <div className="shell">
      <aside className="shell__sidebar" aria-label="Menú principal">
        <div className="shell__brand">
          <img src="/logo.svg" alt="EternaMente" width={56} height={56} />
          <span>EternaMente</span>
        </div>
        <nav className="shell__nav">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`shell__nav-link ${active === item.id ? 'shell__nav-link--active' : ''}`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="shell__sidebar-footer">
          <button type="button" className="shell__theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Modo oscuro' : '☀️ Modo claro'}
          </button>
        </div>
      </aside>

      <div className="shell__main">
        <header className="shell__top">
          <h1 className="shell__page-title">Evaluación cognitiva</h1>
        </header>
        <div className="shell__content">{children}</div>

        {active === 'home' && (
          <section id="ajustes" className="shell__settings">
            <h2>Ajustes de accesibilidad</h2>
            <label className="shell__setting">
              <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
              Alto contraste
            </label>
            <label className="shell__setting">
              Tamaño de texto
              <select
                value={fontScale}
                onChange={(e) => setFontScale(parseFloat(e.target.value))}
              >
                <option value={0.85}>Normal pequeño</option>
                <option value={1}>Normal</option>
                <option value={1.15}>Grande</option>
                <option value={1.3}>Muy grande</option>
              </select>
            </label>
          </section>
        )}
      </div>
    </div>
  );
}
