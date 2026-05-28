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

type Phase = 'stimulus' | 'response';

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function StroopGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.stroop;
  const { settings } = useGameConfig('stroop');
  const ROUNDS = settings.rounds;
  const WORD_DISPLAY_MS = settings.wordDisplayMs;
  const [played, setPlayed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [word, setWord] = useState('');
  const [inkHex, setInkHex] = useState('#333');
  const [inkName, setInkName] = useState('');
  const [phase, setPhase] = useState<Phase>('stimulus');
  const [stimulusKey, setStimulusKey] = useState(0);
  const [finished, setFinished] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const startTimeRef = useRef(0);
  const stimulusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  const clearStimulusTimer = useCallback(() => {
    if (stimulusTimerRef.current) {
      clearTimeout(stimulusTimerRef.current);
      stimulusTimerRef.current = null;
    }
  }, []);

  const beginResponsePhase = useCallback(() => {
    setPhase('response');
    startTimeRef.current = performance.now();
  }, []);

  const showRound = useCallback(() => {
    clearStimulusTimer();
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    const inkIdx = Math.floor(Math.random() * COLORS.length);
    setWord(COLORS[wordIdx].name.toUpperCase());
    setInkHex(COLORS[inkIdx].hex);
    setInkName(COLORS[inkIdx].name);
    setPhase('stimulus');
    setStimulusKey((k) => k + 1);
    stimulusTimerRef.current = setTimeout(beginResponsePhase, WORD_DISPLAY_MS);
  }, [clearStimulusTimer, beginResponsePhase]);

  useEffect(() => {
    if (instructionsOpen) return;
    const t = setTimeout(showRound, 400);
    return () => {
      clearTimeout(t);
      clearStimulusTimer();
    };
  }, [instructionsOpen, showRound, clearStimulusTimer]);

  useEffect(() => () => clearStimulusTimer(), [clearStimulusTimer]);

  useEffect(() => {
    if (played < ROUNDS || finished || savedRef.current) return;
    savedRef.current = true;
    setFinished(true);
    clearStimulusTimer();
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
      stimulusDisplayMs: WORD_DISPLAY_MS,
    });
  }, [played, finished, correct, errors, reactionTimes, onComplete, clearStimulusTimer]);

  useEffect(() => {
    const avg =
      reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
    onStatsChange?.([correct, errors, avg]);
  }, [correct, errors, reactionTimes, onStatsChange]);

  const answer = (colorName: string) => {
    if (finished || played >= ROUNDS || phase !== 'response') return;
    const rt = performance.now() - startTimeRef.current;
    setReactionTimes((r) => [...r, rt]);
    const isCorrect = colorName === inkName;
    setFlash(isCorrect ? 'ok' : 'bad');
    if (isCorrect) setCorrect((c) => c + 1);
    else setErrors((e) => e + 1);
    const nextPlayed = played + 1;
    setPlayed(nextPlayed);
    clearStimulusTimer();
    setTimeout(() => {
      setFlash(null);
      if (nextPlayed < ROUNDS) showRound();
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

  const canAnswer = phase === 'response' && !instructionsOpen;
  const seconds = WORD_DISPLAY_MS / 1000;

  return (
    <div className={`stroop-game ${flash ? `stroop-game--${flash}` : ''}`}>
      <GameInstructions
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        warning={meta.instructions.warning}
        accent={meta.accent}
        collapsed={!instructionsOpen}
        onToggle={() => setInstructionsOpen((o) => !o)}
      />

      {!instructionsOpen && (
        <>
          <div className="stroop-game__progress">
            <div className="stroop-game__progress-bar" style={{ width: `${(played / ROUNDS) * 100}%` }} />
            <span>Ronda {Math.min(played + 1, ROUNDS)} de {ROUNDS}</span>
          </div>

          <p className="stroop-game__hint">
            {phase === 'stimulus' ? (
              <>Observa la palabra durante <strong>{seconds} segundos</strong></>
            ) : (
              <>Selecciona el <strong>color de la tinta</strong>, no la palabra</>
            )}
          </p>

          <div
            className={`stroop-game__word ${phase === 'stimulus' ? 'stroop-game__word--stimulus' : ''}`}
            style={{ color: inkHex }}
          >
            {word || '...'}
          </div>

          {phase === 'stimulus' && (
            <div className="stroop-game__timer" aria-hidden>
              <div
                key={stimulusKey}
                className="stroop-game__timer-bar"
                style={{ animationDuration: `${WORD_DISPLAY_MS}ms` }}
              />
              <span className="stroop-game__timer-label">{seconds}s</span>
            </div>
          )}

          <div className={`stroop-game__buttons ${!canAnswer ? 'stroop-game__buttons--locked' : ''}`}>
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                className="stroop-game__btn"
                style={{ '--btn-color': c.hex } as CSSProperties}
                disabled={!canAnswer}
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
