import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameConfig } from '../../hooks/useGameConfig';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';

type Phase = 'watch' | 'repeat' | 'feedback';

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function CorsiGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.corsi;
  const { settings } = useGameConfig('corsi');
  const gridSize = settings.gridSize;
  const cellCount = gridSize * gridSize;
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('watch');
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const savedRef = useRef(false);

  const seqLen = 2 + level;
  const maxLevel = settings.maxLevel;

  const playSequence = useCallback(
    async (seq: number[]) => {
      setPhase('watch');
      for (const idx of seq) {
        setActiveCell(idx);
        await new Promise((r) => setTimeout(r, settings.flashMs));
        setActiveCell(null);
        await new Promise((r) => setTimeout(r, settings.gapMs));
      }
      setPhase('repeat');
    },
    [settings.flashMs, settings.gapMs]
  );

  const startRound = useCallback(() => {
    const seq: number[] = [];
    while (seq.length < seqLen) {
      const n = Math.floor(Math.random() * cellCount);
      seq.push(n);
    }
    setSequence(seq);
    setPlayerSeq([]);
    playSequence(seq);
  }, [seqLen, cellCount, playSequence]);

  useEffect(() => {
    if (instructionsOpen || finished) return;
    startRound();
  }, [level, instructionsOpen, finished, startRound]);

  useEffect(() => {
    onStatsChange?.([level, correctCount, errors]);
  }, [level, correctCount, errors, onStatsChange]);

  const tapCell = (idx: number) => {
    if (phase !== 'repeat') return;
    const next = [...playerSeq, idx];
    setPlayerSeq(next);
    const expected = sequence[next.length - 1];
    if (idx !== expected) {
      setErrors((e) => e + 1);
      setFinished(true);
      return;
    }
    if (next.length === sequence.length) {
      setCorrectCount((c) => c + 1);
      if (level >= maxLevel) {
        setFinished(true);
      } else {
        setLevel((l) => l + 1);
      }
    }
  };

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    const total = correctCount + (errors > 0 ? 1 : 0);
    onComplete({
      gameType: 'corsi',
      maxLevel,
      achievedLevel: errors > 0 ? Math.max(0, level - 1) : maxLevel,
      correct: correctCount,
      errors,
      accuracy: Number((correctCount / Math.max(1, total)).toFixed(4)),
    });
  }, [finished, correctCount, errors, level, maxLevel, onComplete]);

  return (
    <div className="corsi-game">
      <GameInstructions
        open={instructionsOpen}
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        onStart={() => setInstructionsOpen(false)}
      />
      {!instructionsOpen && (
        <>
          <p className="corsi-game__level">Nivel {level} · {seqLen} casillas</p>
          <div
            className="corsi-game__grid"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {Array.from({ length: cellCount }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`corsi-game__cell ${activeCell === i ? 'active' : ''}`}
                onClick={() => tapCell(i)}
                disabled={phase === 'watch'}
              />
            ))}
          </div>
          <p className="corsi-game__phase">
            {phase === 'watch' ? 'Observa la secuencia…' : 'Repite el patrón'}
          </p>
          {finished && <GameCompleteBanner />}
        </>
      )}
    </div>
  );
}
