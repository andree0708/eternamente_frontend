import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameConfig } from '../../hooks/useGameConfig';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';
import { calcScore } from '../../lib/scoring';

type Phase = 'show' | 'input' | 'feedback';

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function DigitSpanGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.digitspan;
  const { settings, loading } = useGameConfig('digitspan');
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('show');
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showIndex, setShowIndex] = useState(0);
  const [feedbackOk, setFeedbackOk] = useState<boolean | null>(null);
  const savedRef = useRef(false);

  const sequenceStart = settings.sequenceStart || 3;
  const maxLevel = settings.maxLevel || 5;
  const displayMs = settings.displayMsPerDigit || 600;
  const length = sequenceStart + level - 1;

  const startRound = useCallback(() => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * 9) + 1);
    }
    setSequence(seq);
    setInput('');
    setShowIndex(0);
    setPhase('show');
    setFeedbackOk(null);
  }, [length]);

  useEffect(() => {
    if (!started || finished) return;
    startRound();
  }, [level, started, finished, startRound]);

  useEffect(() => {
    onStatsChange?.([level, correctCount, errors]);
  }, [level, correctCount, errors, onStatsChange]);

  useEffect(() => {
    if (phase !== 'show' || !started || sequence.length === 0) return;
    if (showIndex >= sequence.length) {
      setPhase('input');
      return;
    }
    const t = setTimeout(() => setShowIndex((i) => i + 1), displayMs);
    return () => clearTimeout(t);
  }, [phase, showIndex, sequence, displayMs, started]);

  const submitAnswer = () => {
    const expected = sequence.join('');
    const ok = input.trim() === expected;
    setFeedbackOk(ok);
    setPhase('feedback');

    if (ok) {
      setCorrectCount((c) => c + 1);
      if (level >= maxLevel) {
        setTimeout(() => setFinished(true), 900);
      } else {
        setTimeout(() => {
          setLevel((l) => l + 1);
        }, 900);
      }
    } else {
      setErrors((e) => e + 1);
      setTimeout(() => setFinished(true), 1400);
    }
  };

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    const total = correctCount + (errors > 0 ? 1 : 0);
    const score = calcScore('digitspan', { correct: correctCount, errors });
    onComplete({
      gameType: 'digitspan',
      maxLevel,
      achievedLevel: errors > 0 ? Math.max(0, level - 1) : maxLevel,
      correct: correctCount,
      errors,
      accuracy: Number((correctCount / Math.max(1, total)).toFixed(4)),
      score,
    });
  }, [finished, correctCount, errors, level, maxLevel, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'input' || finished) return;
      if (e.key >= '1' && e.key <= '9') { appendDigit(e.key); return; }
      if (e.key === '0') { appendDigit('0'); return; }
      if (e.key === 'Backspace') { setInput((v) => v.slice(0, -1)); return; }
      if (e.key === 'Enter') { submitAnswer(); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const appendDigit = (d: string) => {
    if (phase !== 'input' || input.length >= length) return;
    setInput((v) => v + d);
  };

  if (finished) {
    const score = calcScore('digitspan', { correct: correctCount, errors });
    return (
      <div className="digit-game">
        <GameCompleteBanner
          title={errors > 0 ? 'Partida terminada' : '¡Excelente memoria!'}
          stats={[
            { label: 'Nivel alcanzado', value: String(errors > 0 ? Math.max(0, level - 1) : maxLevel) },
            { label: 'Aciertos', value: String(correctCount) },
            { label: 'Errores', value: String(errors) },
            { label: 'Puntuación', value: String(score) },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="digit-game">
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
          <p className="digit-game__level">Nivel {level} de {maxLevel}</p>
          {errors > 0 && (
            <p className="digit-game__errors" role="status">Errores acumulados: {errors}</p>
          )}
          {phase === 'show' && (
            <>
              <p className="digit-game__watch-label">Observa la secuencia…</p>
              <div className="digit-game__display" aria-live="polite">
                {showIndex < sequence.length ? (
                  <div className="digit-game__sequence">
                    {sequence.slice(0, showIndex + 1).map((d, i) => (
                      <span key={i} className="digit-game__digit">
                        <span className="digit-game__pos">{i + 1}.</span>
                        <span className="digit-game__val">{d}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="digit-game__hint">Tu turno — escribe la secuencia</span>
                )}
              </div>
            </>
          )}
          {phase === 'input' && (
            <>
              <p className="digit-game__watch-label">Repite la secuencia</p>
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
          {phase === 'feedback' && feedbackOk !== null && (
            <div
              className={`game-feedback game-feedback--${feedbackOk ? 'ok' : 'bad'}`}
              role="status"
            >
              {feedbackOk ? (
                <p>✓ ¡Correcto! {level < maxLevel ? 'Siguiente nivel…' : 'Completaste todos los niveles.'}</p>
              ) : (
                <p>✗ Secuencia incorrecta. La correcta era: <strong>{sequence.join(' ')}</strong></p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
