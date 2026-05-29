import type { CSSProperties } from 'react';

interface Props {
  title: string;
  steps: string[];
  warning?: string;
  accent: string;
  /** false = pantalla inicial con botón Iniciar partida */
  started: boolean;
  onStart: () => void;
  /** Panel de ayuda colapsable durante la partida */
  helpOpen?: boolean;
  onToggleHelp?: () => void;
}

export function GameInstructions({
  title,
  steps,
  warning,
  accent,
  started,
  onStart,
  helpOpen = false,
  onToggleHelp,
}: Props) {
  if (!started) {
    return (
      <div className="game-start" style={{ '--game-accent': accent } as CSSProperties}>
        <div className="game-start__card">
          <h2>{title}</h2>
          <ol className="game-start__steps">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {warning && <p className="game-start__warning">⚠️ {warning}</p>}
          <button type="button" className="btn btn-accent btn-full game-start__btn" onClick={onStart}>
            Iniciar partida
          </button>
        </div>
      </div>
    );
  }

  if (!onToggleHelp) return null;

  return (
    <aside className="game-instructions" style={{ '--game-accent': accent } as CSSProperties}>
      <button
        type="button"
        className="game-instructions__toggle"
        onClick={onToggleHelp}
        aria-expanded={helpOpen}
      >
        <span className="game-instructions__icon">📋</span>
        <span>Ayuda</span>
        <span className="game-instructions__chevron">{helpOpen ? '▲' : '▼'}</span>
      </button>
      {helpOpen && (
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
