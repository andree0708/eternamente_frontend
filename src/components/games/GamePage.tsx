import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { GAME_META, parseGameType } from '../../lib/gameConfig';
import { useGameSession } from '../../hooks/useGameSession';
import { GameErrorBoundary } from './GameErrorBoundary';
import { GameStatsBar } from './GameStatsBar';
import { MemoryGame } from './MemoryGame';
import { NavigationGame } from './NavigationGame';
import { ResultsPanel } from './ResultsPanel';
import { StroopGame } from './StroopGame';
import { WhackGame } from './WhackGame';
import { DigitSpanGame } from './DigitSpanGame';
import { CorsiGame } from './CorsiGame';
import { OrientationGame } from './OrientationGame';
import { ArithmeticGame } from './ArithmeticGame';
import '../../styles/games.css';

function getGameTypeFromUrl(): string {
  if (typeof window === 'undefined') return 'memory';
  return new URLSearchParams(window.location.search).get('type') || 'memory';
}

export function GamePage() {
  const gameType = useMemo(() => parseGameType(getGameTypeFromUrl()), []);
  const meta = GAME_META[gameType];
  const [user, setUser] = useState<{ fullName?: string; email?: string } | null>(null);
  const [stats, setStats] = useState<[string | number, string | number, string | number]>([0, 0, 0]);
  const [resetKey, setResetKey] = useState(0);
  const session = useGameSession(gameType);

  useEffect(() => {
    const token = localStorage.getItem('eternamente_token');
    const raw = localStorage.getItem('eternamente_user');
    if (!token || !raw) {
      window.location.href = '/';
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      window.location.href = '/';
    }
  }, []);

  const handleNewGame = () => {
    session.resetSession();
    setResetKey((k) => k + 1);
  };

  // Evita que onComplete cambie en cada render y dispare guardados extra
  const completeRef = useRef(session.completeAndSave);
  completeRef.current = session.completeAndSave;
  const stableOnComplete = useCallback(
    (metrics: Record<string, unknown>) => completeRef.current(metrics),
    []
  );

  const logout = () => {
    localStorage.removeItem('eternamente_token');
    localStorage.removeItem('eternamente_user');
    window.location.href = '/';
  };

  const gameElement = useMemo(() => {
    const props = {
      key: resetKey,
      onComplete: stableOnComplete,
      onStatsChange: (v: [number, number, number | string]) =>
        setStats([v[0], v[1], typeof v[2] === 'number' ? v[2] : v[2]]),
    };
    switch (gameType) {
      case 'stroop':
        return <StroopGame {...props} onStatsChange={(v) => setStats(v)} />;
      case 'whackamole':
        return <WhackGame {...props} onStatsChange={(v) => setStats(v)} />;
      case 'navigation':
        return <NavigationGame {...props} onStatsChange={(v) => setStats(v)} />;
      case 'digitspan':
        return <DigitSpanGame {...props} onStatsChange={(v) => setStats(v)} />;
      case 'corsi':
        return <CorsiGame {...props} onStatsChange={(v) => setStats(v)} />;
      case 'orientation':
        return <OrientationGame {...props} onStatsChange={(v) => setStats(v)} />;
      case 'arithmetic':
        return <ArithmeticGame {...props} onStatsChange={(v) => setStats(v)} />;
      default:
        return (
          <MemoryGame
            key={resetKey}
            onComplete={stableOnComplete}
            onStatsChange={(v) => setStats(v)}
          />
        );
    }
  }, [gameType, resetKey, stableOnComplete]);

  return (
    <div className="game-app" style={{ '--game-accent': meta.accent } as CSSProperties}>
      <header className="game-app__header">
        <a href="/games" className="game-app__back">← Juegos</a>
        <div className="game-app__user">
          <span className="game-app__avatar">👤</span>
          <span>{user?.fullName || user?.email || 'Usuario'}</span>
        </div>
        <button type="button" className="game-app__logout" onClick={logout}>
          Salir
        </button>
      </header>

      <main className="game-app__layout">
        <section className="game-app__play">
          <header className="game-app__title">
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
            <span className="game-app__evaluates">
              <strong>Qué evalúa:</strong> {meta.evaluates}
            </span>
          </header>

          <GameStatsBar labels={meta.stats} values={stats} accent={meta.accent} />

          {session.saveMessage && (
            <div className={`game-app__toast game-app__toast--${session.saveMessage.type}`}>
              {session.saveMessage.text}
            </div>
          )}

          <div className="game-app__board">
            <GameErrorBoundary gameType={gameType}>
              {gameElement}
            </GameErrorBoundary>
          </div>

          {session.gameCompleted && (
            <div className="game-app__actions">
              <button type="button" className="btn btn-primary" onClick={handleNewGame}>
                Nueva partida
              </button>
            </div>
          )}
        </section>

        <ResultsPanel
          visible={session.gameCompleted}
          lastAssessmentId={session.lastAssessmentId}
          gameCompleted={session.gameCompleted}
          saved={session.saveMessage?.type === 'success'}
        />
      </main>
    </div>
  );
}
