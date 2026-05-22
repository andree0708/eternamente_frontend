import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';

const MAX_LEVEL = 5;
const GRID_SIZE = 5;

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function NavigationGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.navigation;
  const [level, setLevel] = useState(1);
  const [currentPos, setCurrentPos] = useState(0);
  const [targetPos, setTargetPos] = useState(0);
  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [levelFlash, setLevelFlash] = useState(false);
  const savedRef = useRef(false);

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
    setMoves(0);
    setLevelFlash(true);
    setTimeout(() => setLevelFlash(false), 600);
  }, []);

  useEffect(() => {
    startLevel();
  }, [level, startLevel]);

  useEffect(() => {
    onStatsChange?.([level, moves, errors]);
  }, [level, moves, errors, onStatsChange]);

  const move = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (finished) return;
    const row = Math.floor(currentPos / GRID_SIZE);
    const col = currentPos % GRID_SIZE;
    let next = currentPos;
    if (dir === 'up' && row > 0) next -= GRID_SIZE;
    if (dir === 'down' && row < GRID_SIZE - 1) next += GRID_SIZE;
    if (dir === 'left' && col > 0) next -= 1;
    if (dir === 'right' && col < GRID_SIZE - 1) next += 1;
    if (next === currentPos) return;

    setMoves((m) => m + 1);
    setCurrentPos(next);

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
    onComplete({
      gameType: 'navigation',
      maxLevel: MAX_LEVEL,
      achievedLevel: MAX_LEVEL,
      totalMoves: moves,
      errors,
    });
  }, [finished, moves, errors, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      if (map[e.key]) {
        e.preventDefault();
        move(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    return (
      <GameCompleteBanner
        stats={[
          { label: 'Niveles', value: `${MAX_LEVEL}/${MAX_LEVEL}` },
          { label: 'Movimientos', value: String(moves) },
          { label: 'Errores', value: String(errors) },
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
        collapsed={!instructionsOpen}
        onToggle={() => setInstructionsOpen((o) => !o)}
      />

      <div className="nav-game__header">
        <span>Nivel {level} / {MAX_LEVEL}</span>
        <span>Movimientos: {moves}</span>
      </div>

      <div className="nav-game__arena">
        <div
          className="nav-game__grid"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => (
            <div
              key={i}
              className={`nav-game__cell ${i === currentPos ? 'player' : ''} ${i === targetPos ? 'goal' : ''}`}
            >
              {i === currentPos && <span>★</span>}
              {i === targetPos && <span>⚑</span>}
            </div>
          ))}
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

      <p className="nav-game__tip">También puedes usar las flechas del teclado ↑ ↓ ← →</p>
    </div>
  );
}
