import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';

const ROUNDS = 30;
const GRID = 3;
const SHOW_MS = 1400;

type CellState = 'idle' | 'target' | 'distractor' | 'hit' | 'miss';

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function WhackGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.whackamole;
  const [cells, setCells] = useState<CellState[]>(Array(GRID * GRID).fill('idle'));
  const [played, setPlayed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [falsePositives, setFalsePositives] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const targetRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (played < ROUNDS || finished) return;
    setFinished(true);
    const avg =
      reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;
    onComplete({
      gameType: 'whackamole',
      totalRounds: ROUNDS,
      correct,
      errors,
      falsePositives,
      accuracy: Number((correct / ROUNDS).toFixed(4)),
      averageReactionTimeMs: Number(avg.toFixed(2)),
    });
  }, [played, finished, correct, errors, falsePositives, reactionTimes, onComplete]);

  const nextRound = useCallback(() => {
    if (played >= ROUNDS) return;
    const idle = Array(GRID * GRID).fill('idle') as CellState[];
    const targetIdx = Math.floor(Math.random() * idle.length);
    let distractorIdx: number | null = null;
    if (Math.random() > 0.35) {
      do {
        distractorIdx = Math.floor(Math.random() * idle.length);
      } while (distractorIdx === targetIdx);
    }
    idle[targetIdx] = 'target';
    if (distractorIdx !== null) idle[distractorIdx] = 'distractor';
    setCells(idle);
    targetRef.current = targetIdx;
    startRef.current = performance.now();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (targetRef.current === targetIdx) {
        targetRef.current = null;
        setErrors((e) => e + 1);
        setPlayed((p) => p + 1);
        setCells((c) => c.map((_, i) => (i === targetIdx ? 'miss' : 'idle')));
        setTimeout(nextRound, 400);
      }
    }, SHOW_MS);
  }, [played]);

  useEffect(() => {
    const t = setTimeout(nextRound, 1200);
    return () => {
      clearTimeout(t);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const avg =
      reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
    onStatsChange?.([correct, errors, avg]);
  }, [correct, errors, reactionTimes, onStatsChange]);

  const handleCell = (index: number) => {
    if (finished) return;
    const state = cells[index];
    if (state !== 'target' && state !== 'distractor') return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    targetRef.current = null;

    if (state === 'target') {
      setReactionTimes((r) => [...r, performance.now() - startRef.current]);
      setCorrect((c) => c + 1);
      setPlayed((p) => p + 1);
      setCells((c) => c.map((_, i) => (i === index ? 'hit' : 'idle')));
      setTimeout(nextRound, 350);
    } else {
      setFalsePositives((f) => f + 1);
      setErrors((e) => e + 1);
      setPlayed((p) => p + 1);
      setCells((c) => c.map((_, i) => (i === index ? 'miss' : 'idle')));
      setTimeout(nextRound, 350);
    }
  };

  if (finished) {
    const avg = Math.round(
      reactionTimes.reduce((a, b) => a + b, 0) / (reactionTimes.length || 1)
    );
    return (
      <GameCompleteBanner
        stats={[
          { label: 'Aciertos', value: `${correct}/${ROUNDS}` },
          { label: 'Errores', value: String(errors) },
          { label: 'Falsos +', value: String(falsePositives) },
          { label: 'Tiempo medio', value: `${avg} ms` },
        ]}
        onBack={() => { window.location.href = '/games'; }}
      />
    );
  }

  return (
    <div className="whack-game">
      <GameInstructions
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        warning={meta.instructions.warning}
        accent={meta.accent}
        collapsed={!instructionsOpen}
        onToggle={() => setInstructionsOpen((o) => !o)}
      />

      <div className="whack-game__progress">
        <span>✅ {correct}</span>
        <span>❌ {errors}</span>
        <span>{played}/{ROUNDS}</span>
      </div>

      <div className="whack-game__grid">
        {cells.map((state, i) => (
          <button
            key={i}
            type="button"
            className={`whack-game__cell whack-game__cell--${state}`}
            onClick={() => handleCell(i)}
            disabled={state === 'idle' || state === 'hit' || state === 'miss'}
          >
            {state === 'target' && <span className="whack-game__mole">🐹</span>}
            {state === 'distractor' && <span className="whack-game__x">✕</span>}
            {state === 'hit' && <span>✓</span>}
            {state === 'miss' && <span>⏰</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
