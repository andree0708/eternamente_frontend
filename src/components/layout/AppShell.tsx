import { useState, type ReactNode, useEffect } from 'react';
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
];

export function AppShell({ children, active }: Props) {
  const { theme, toggleTheme, highContrast, toggleHighContrast, fontScale, setFontScale } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.shell__sidebar') && !target.closest('.shell__hamburger')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const logout = () => {
    localStorage.removeItem('eternamente_token');
    localStorage.removeItem('eternamente_user');
    window.location.href = '/';
  };

  return (
    <div className="shell">
      <button
        type="button"
        className="shell__hamburger"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Menú"
      >
        <span className={`shell__hamburger-line ${menuOpen ? 'open' : ''}`} />
      </button>

      <div className={`shell__overlay ${menuOpen ? 'shell__overlay--visible' : ''}`} />

      <aside className={`shell__sidebar ${menuOpen ? 'shell__sidebar--open' : ''}`} aria-label="Menú principal">
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
              onClick={() => setMenuOpen(false)}
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="shell__settings-section">
          <h3 className="shell__settings-title">Ajustes</h3>

          <button type="button" className="shell__setting-row" onClick={toggleTheme}>
            <span>{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
          </button>

          <label className="shell__setting-row">
            <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
            <span>Alto contraste</span>
          </label>

          <label className="shell__setting-row shell__setting-row--col">
            <span>Tamaño de texto</span>
            <select value={fontScale} onChange={(e) => setFontScale(parseFloat(e.target.value))}>
              <option value={0.85}>Pequeño</option>
              <option value={1}>Normal</option>
              <option value={1.15}>Grande</option>
              <option value={1.3}>Muy grande</option>
            </select>
          </label>

          <hr className="shell__divider" />

          <button type="button" className="shell__setting-row shell__setting-row--danger" onClick={logout}>
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="shell__main">
        <div className="shell__content">{children}</div>
      </div>
    </div>
  );
}
