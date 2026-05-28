import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameConfig } from '../../hooks/useGameConfig';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';

type Phase = 'show' | 'input' | 'feedback';

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function DigitSpanGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.digitspan;
  const { settings } = useGameConfig('digitspan');
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('show');
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [showIndex, setShowIndex] = useState(0);
  const savedRef = useRef(false);

  const length = settings.sequenceStart + level - 1;
  const maxLevel = settings.maxLevel;

  const startRound = useCallback(() => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * 9) + 1);
    }
    setSequence(seq);
    setInput('');
    setShowIndex(0);
    setPhase('show');
  }, [length]);

  useEffect(() => {
    if (instructionsOpen || finished) return;
    startRound();
  }, [level, instructionsOpen, finished, startRound]);

  useEffect(() => {
    onStatsChange?.([level, correctCount, errors]);
  }, [level, correctCount, errors, onStatsChange]);

  useEffect(() => {
    if (phase !== 'show' || instructionsOpen || sequence.length === 0) return;
    if (showIndex >= sequence.length) {
      setPhase('input');
      return;
    }
    const t = setTimeout(() => setShowIndex((i) => i + 1), settings.displayMsPerDigit);
    return () => clearTimeout(t);
  }, [phase, showIndex, sequence, settings.displayMsPerDigit, instructionsOpen]);

  const submitAnswer = () => {
    const expected = sequence.join('');
    const ok = input.trim() === expected;
    if (ok) {
      setCorrectCount((c) => c + 1);
      if (level >= maxLevel) {
        setFinished(true);
      } else {
        setLevel((l) => l + 1);
      }
    } else {
      setErrors((e) => e + 1);
      setFinished(true);
    }
    setPhase('feedback');
    setTimeout(() => {
      if (!ok) return;
      setPhase('show');
    }, 800);
  };

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    const total = correctCount + (errors > 0 ? 1 : 0);
    onComplete({
      gameType: 'digitspan',
      maxLevel,
      achievedLevel: errors > 0 ? level - 1 : maxLevel,
      correct: correctCount,
      errors,
      accuracy: Number((correctCount / Math.max(1, total)).toFixed(4)),
    });
  }, [finished, correctCount, errors, level, maxLevel, onComplete]);

  const appendDigit = (d: string) => {
    if (phase !== 'input' || input.length >= length) return;
    setInput((v) => v + d);
  };

  return (
    <div className="digit-game">
      <GameInstructions
        open={instructionsOpen}
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        onStart={() => setInstructionsOpen(false)}
      />
      {!instructionsOpen && (
        <>
          <p className="digit-game__level">Nivel {level} de {maxLevel}</p>
          {phase === 'show' && (
            <div className="digit-game__display" aria-live="polite">
              {showIndex < sequence.length ? (
                <span className="digit-game__digit">{sequence[showIndex]}</span>
              ) : (
                <span className="digit-game__hint">Tu turno</span>
              )}
            </div>
          )}
          {phase === 'input' && (
            <>
              <div className="digit-game__input">{input || '—'}</div>
              <div className="digit-game__pad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button key={n} type="button" className="digit-game__key" onClick={() => appendDigit(String(n))}>
                    {n}
                  </button>
                ))}
                <button type="button" className="digit-game__key digit-game__key--wide" onClick={() => setInput('')}>
                  Borrar
                </button>
                <button type="button" className="btn btn-accent digit-game__submit" onClick={submitAnswer}>
                  Confirmar
                </button>
              </div>
            </>
          )}
          {finished && <GameCompleteBanner />}
        </>
      )}
    </div>
  );
}
