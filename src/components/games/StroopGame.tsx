import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';
import { useGameConfig } from '../../hooks/useGameConfig';

const COLORS = [
  { name: 'rojo', hex: '#E53935', label: 'Rojo' },
  { name: 'azul', hex: '#1E88E5', label: 'Azul' },
  { name: 'verde', hex: '#43A047', label: 'Verde' },
  { name: 'amarillo', hex: '#FDD835', label: 'Amarillo' },
] as const;

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function StroopGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.stroop;
  const { settings, loading } = useGameConfig('stroop');
  const ROUNDS = settings.rounds;
  const TIME_LIMIT_SECONDS = settings.timeLimitSeconds || 5;
  const [played, setPlayed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [word, setWord] = useState('');
  const [inkHex, setInkHex] = useState('#333');
  const [inkName, setInkName] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [finished, setFinished] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [started, setStarted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(false);
  const finishedRef = useRef(false);
  const roundAnsweredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const showRound = useCallback(() => {
    clearTimer();
    roundAnsweredRef.current = false;
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    const inkIdx = Math.floor(Math.random() * COLORS.length);
    setWord(COLORS[wordIdx].name.toUpperCase());
    setInkHex(COLORS[inkIdx].hex);
    setInkName(COLORS[inkIdx].name);
    setTimeLeft(TIME_LIMIT_SECONDS);
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          if (!roundAnsweredRef.current) {
            setErrors((e) => e + 1);
            const next = played + 1;
            if (next >= ROUNDS) {
              finishedRef.current = true;
              setFinished(true);
            } else {
              setTimeout(showRound, 300);
            }
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [clearTimer, played, ROUNDS, TIME_LIMIT_SECONDS]);

  useEffect(() => {
    if (!started || loading || ROUNDS <= 0) return;
    const t = setTimeout(showRound, 400);
    return () => { clearTimeout(t); clearTimer(); };
  }, [started, loading, ROUNDS, showRound, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (played < ROUNDS || finished || savedRef.current) return;
    savedRef.current = true;
    finishedRef.current = true;
    setFinished(true);
    clearTimer();
    const avg =
      reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;
    onComplete({
      gameType: 'stroop',
      totalRounds: ROUNDS,
      correct,
      errors,
      accuracy: Number((correct / ROUNDS).toFixed(4)),
      averageReactionTimeMs: Number(avg.toFixed(2)),
      timeLimitSeconds: TIME_LIMIT_SECONDS,
    });
  }, [played, finished, correct, errors, reactionTimes, onComplete, clearTimer, TIME_LIMIT_SECONDS, ROUNDS]);

  useEffect(() => {
    const avg =
      reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
    onStatsChange?.([correct, errors, avg]);
  }, [correct, errors, reactionTimes, onStatsChange]);

  const answer = (colorName: string) => {
    if (finishedRef.current || played >= ROUNDS || roundAnsweredRef.current) return;
    roundAnsweredRef.current = true;
    const rt = performance.now() - startTimeRef.current;
    setReactionTimes((r) => [...r, rt]);
    const isCorrect = colorName === inkName;
    setFlash(isCorrect ? 'ok' : 'bad');
    if (isCorrect) setCorrect((c) => c + 1);
    else setErrors((e) => e + 1);
    const nextPlayed = played + 1;
    setPlayed(nextPlayed);
    clearTimer();
    setTimeout(() => {
      setFlash(null);
      if (nextPlayed < ROUNDS) showRound();
      else { finishedRef.current = true; setFinished(true); }
    }, 400);
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
          { label: 'Tiempo medio', value: `${avg} ms` },
        ]}
        onBack={() => { window.location.href = '/games'; }}
      />
    );
  }

  return (
    <div className={`stroop-game ${flash ? `stroop-game--${flash}` : ''}`}>
      <GameInstructions
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        warning={meta.instructions.warning}
        accent={meta.accent}
        started={started}
        onStart={() => setStarted(true)}
        helpOpen={helpOpen}
        onToggleHelp={() => setHelpOpen((o) => !o)}
      />

      {started && (
        <>
          <div className="stroop-game__progress">
            <div className="stroop-game__progress-bar" style={{ width: `${(played / ROUNDS) * 100}%` }} />
            <span>Ronda {Math.min(played + 1, ROUNDS)} de {ROUNDS}</span>
          </div>

          <p className="stroop-game__hint">
            Responde rápido: marca el <strong>color de la tinta</strong>, no la palabra
          </p>

          <div
            className="stroop-game__word"
            style={{ color: inkHex }}
          >
            {word || '...'}
          </div>

          <div className="stroop-game__timer" aria-hidden>
            <div
              key={played}
              className="stroop-game__timer-bar"
              style={{ width: `${(timeLeft / TIME_LIMIT_SECONDS) * 100}%` }}
            />
            <span className="stroop-game__timer-label">{timeLeft}s</span>
          </div>

          <div className="stroop-game__buttons">
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                className="stroop-game__btn"
                style={{ '--btn-color': c.hex } as CSSProperties}
                onClick={() => answer(c.name)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
