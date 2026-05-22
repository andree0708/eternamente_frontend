import type { CSSProperties } from 'react';

interface Props {
  title: string;
  steps: string[];
  warning?: string;
  accent: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function GameInstructions({ title, steps, warning, accent, collapsed, onToggle }: Props) {
  return (
    <aside className="game-instructions" style={{ '--game-accent': accent } as CSSProperties}>
      <button type="button" className="game-instructions__toggle" onClick={onToggle} aria-expanded={!collapsed}>
        <span className="game-instructions__icon">📋</span>
        <span>{title}</span>
        <span className="game-instructions__chevron">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <div className="game-instructions__body">
          <ol className="game-instructions__steps">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {warning && <p className="game-instructions__warning">⚠️ {warning}</p>}
        </div>
      )}
    </aside>
  );
}
