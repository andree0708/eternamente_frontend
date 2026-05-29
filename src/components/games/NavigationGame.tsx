import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';
import { useGameConfig } from '../../hooks/useGameConfig';
import { calcScore } from '../../lib/scoring';

const OBSTACLE_SYMBOLS = ['●', '▲', '◆', '✖', '✦'];

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function NavigationGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.navigation;
  const { settings } = useGameConfig('navigation');
  const MAX_LEVEL = settings.maxLevel;
  const GRID_SIZE = settings.gridSize;
  const [level, setLevel] = useState(1);
  const [currentPos, setCurrentPos] = useState(0);
  const [targetPos, setTargetPos] = useState(0);
  const [obstacles, setObstacles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [levelFlash, setLevelFlash] = useState(false);
  const savedRef = useRef(false);
  const errorsRef = useRef(0);

  const startLevel = useCallback(() => {
    const size = GRID_SIZE * GRID_SIZE;
    let start: number;
    let target: number;
    do {
      start = Math.floor(Math.random() * size);
      target = Math.floor(Math.random() * size);
    } while (start === target);
    setCurrentPos(start);
    setTargetPos(target);

    const obsCount = Math.min(level + 2, Math.floor(size * 0.25));
    const obs: number[] = [];
    while (obs.length < obsCount) {
      const o = Math.floor(Math.random() * size);
      if (o !== start && o !== target && !obs.includes(o)) obs.push(o);
    }
    setObstacles(obs);
    setMoves(0);
    setLevelFlash(true);
    setTimeout(() => setLevelFlash(false), 600);
  }, [level, GRID_SIZE]);

  useEffect(() => {
    if (!started) return;
    startLevel();
  }, [level, started, startLevel]);

  useEffect(() => {
    onStatsChange?.([level, totalMoves, errors]);
  }, [level, totalMoves, errors, onStatsChange]);

  const move = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (finished) return;
    const row = Math.floor(currentPos / GRID_SIZE);
    const col = currentPos % GRID_SIZE;
    let next = currentPos;
    let invalid = false;
    if (dir === 'up' && row > 0) next -= GRID_SIZE;
    else if (dir === 'down' && row < GRID_SIZE - 1) next += GRID_SIZE;
    else if (dir === 'left' && col > 0) next -= 1;
    else if (dir === 'right' && col < GRID_SIZE - 1) next += 1;
    else invalid = true;

    if (invalid) {
      errorsRef.current += 1;
      setErrors(errorsRef.current);
      return;
    }

    setMoves((m) => m + 1);
    setTotalMoves((m) => m + 1);
    setCurrentPos(next);

    if (obstacles.includes(next)) {
      errorsRef.current += 1;
      setErrors(errorsRef.current);
      return;
    }

    if (next === targetPos) {
      if (level >= MAX_LEVEL) {
        setFinished(true);
      } else {
        setLevel((l) => l + 1);
      }
    }
  };

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    const correctMoves = Math.max(0, totalMoves - errorsRef.current);
    const score = calcScore('navigation', { correct: correctMoves, errors: errorsRef.current });
    onComplete({
      gameType: 'navigation',
      maxLevel: MAX_LEVEL,
      achievedLevel: MAX_LEVEL,
      totalMoves,
      errors: errorsRef.current,
      score,
    });
  }, [finished, totalMoves, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    const correctMoves = Math.max(0, totalMoves - errorsRef.current);
    const score = calcScore('navigation', { correct: correctMoves, errors: errorsRef.current });
    return (
      <GameCompleteBanner
        stats={[
          { label: 'Niveles', value: `${MAX_LEVEL}/${MAX_LEVEL}` },
          { label: 'Movimientos totales', value: String(totalMoves) },
          { label: 'Errores', value: String(errorsRef.current) },
          { label: 'Puntuación', value: String(score) },
        ]}
        onBack={() => { window.location.href = '/games'; }}
      />
    );
  }

  const canUp = Math.floor(currentPos / GRID_SIZE) > 0;
  const canDown = Math.floor(currentPos / GRID_SIZE) < GRID_SIZE - 1;
  const canLeft = currentPos % GRID_SIZE > 0;
  const canRight = currentPos % GRID_SIZE < GRID_SIZE - 1;

  return (
    <div className={`nav-game ${levelFlash ? 'nav-game--flash' : ''}`}>
      <GameInstructions
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        accent={meta.accent}
        started={started}
        onStart={() => setStarted(true)}
        helpOpen={helpOpen}
        onToggleHelp={() => setHelpOpen((o) => !o)}
      />

      {started && (
        <>
          <div className="nav-game__header">
            <span>Nivel {level} / {MAX_LEVEL}</span>
            <span>Movs: {totalMoves}</span>
            <span>Errores: {errorsRef.current}</span>
          </div>

          <div className="nav-game__arena">
            <div
              className="nav-game__grid"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
                const isObstacle = obstacles.includes(i);
                return (
                  <div
                    key={i}
                    className={`nav-game__cell ${i === currentPos ? 'player' : ''} ${i === targetPos ? 'goal' : ''} ${isObstacle ? 'obstacle' : ''}`}
                  >
                    {i === currentPos && <span className="nav-game__player">★</span>}
                    {i === targetPos && <span className="nav-game__goal">⚑</span>}
                    {isObstacle && i !== currentPos && (
                      <span className="nav-game__obs">{OBSTACLE_SYMBOLS[i % OBSTACLE_SYMBOLS.length]}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="nav-game__controls">
              <button type="button" disabled={!canUp} onClick={() => move('up')} aria-label="Arriba">▲</button>
              <div className="nav-game__controls-row">
                <button type="button" disabled={!canLeft} onClick={() => move('left')} aria-label="Izquierda">◀</button>
                <button type="button" disabled={!canRight} onClick={() => move('right')} aria-label="Derecha">▶</button>
              </div>
              <button type="button" disabled={!canDown} onClick={() => move('down')} aria-label="Abajo">▼</button>
            </div>
          </div>

          <p className="nav-game__tip">Esquiva los obstáculos (● ▲ ◆ ✖ ✦) · También usa las flechas del teclado</p>
        </>
      )}
    </div>
  );
}
