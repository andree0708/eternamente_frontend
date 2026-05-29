import { useState, type ReactNode } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`shell ${sidebarOpen ? 'shell--open' : 'shell--closed'}`}>
      <button
        type="button"
        className="shell__toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      <aside className="shell__sidebar" aria-label="Menú principal">
        <div className="shell__brand">
          <img src="/logo.svg" alt="EternaMente" width={40} height={40} />
          <span className="shell__brand-text">EternaMente</span>
        </div>
        <nav className="shell__nav">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`shell__nav-link ${active === item.id ? 'shell__nav-link--active' : ''}`}
            >
              <span aria-hidden>{item.icon}</span>
              <span className="shell__nav-label">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="shell__sidebar-footer">
          <button type="button" className="shell__theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
            <span className="shell__nav-label">{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
          </button>
          <div className="shell__acc-options">
            <label className="shell__acc-row">
              <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
              <span className="shell__nav-label">Alto contraste</span>
            </label>
            <label className="shell__acc-row">
              <span className="shell__nav-label">Texto</span>
              <select value={fontScale} onChange={(e) => setFontScale(parseFloat(e.target.value))}>
                <option value={0.85}>Pequeño</option>
                <option value={1}>Normal</option>
                <option value={1.15}>Grande</option>
                <option value={1.3}>Muy grande</option>
              </select>
            </label>
          </div>
        </div>
      </aside>

      <div className="shell__main">
        <header className="shell__top">
          <h1 className="shell__page-title">Evaluación cognitiva</h1>
        </header>
        <div className="shell__content">{children}</div>
      </div>
    </div>
  );
}
