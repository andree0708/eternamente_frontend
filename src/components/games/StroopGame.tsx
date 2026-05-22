import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';

const COLORS = [
  { name: 'rojo', hex: '#E53935', label: 'Rojo' },
  { name: 'azul', hex: '#1E88E5', label: 'Azul' },
  { name: 'verde', hex: '#43A047', label: 'Verde' },
  { name: 'amarillo', hex: '#FDD835', label: 'Amarillo' },
] as const;

const ROUNDS = 20;

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function StroopGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.stroop;
  const [played, setPlayed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [word, setWord] = useState('');
  const [inkHex, setInkHex] = useState('#333');
  const [inkName, setInkName] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [finished, setFinished] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const savedRef = useRef(false);

  const showRound = useCallback(() => {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    const inkIdx = Math.floor(Math.random() * COLORS.length);
    setWord(COLORS[wordIdx].name.toUpperCase());
    setInkHex(COLORS[inkIdx].hex);
    setInkName(COLORS[inkIdx].name);
    setStartTime(performance.now());
  }, []);

  useEffect(() => {
    const t = setTimeout(showRound, 600);
    return () => clearTimeout(t);
  }, [showRound]);

  useEffect(() => {
    if (played < ROUNDS || finished || savedRef.current) return;
    savedRef.current = true;
    setFinished(true);
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
    });
  }, [played, finished, correct, errors, reactionTimes, onComplete]);

  useEffect(() => {
    const avg =
      reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
    onStatsChange?.([correct, errors, avg]);
  }, [correct, errors, reactionTimes, onStatsChange]);

  const answer = (colorName: string) => {
    if (finished || played >= ROUNDS) return;
    const rt = performance.now() - startTime;
    setReactionTimes((r) => [...r, rt]);
    const isCorrect = colorName === inkName;
    setFlash(isCorrect ? 'ok' : 'bad');
    if (isCorrect) setCorrect((c) => c + 1);
    else setErrors((e) => e + 1);
    setPlayed((p) => p + 1);
    setTimeout(() => {
      setFlash(null);
      if (played + 1 < ROUNDS) showRound();
    }, 350);
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
        collapsed={!instructionsOpen}
        onToggle={() => setInstructionsOpen((o) => !o)}
      />

      <div className="stroop-game__progress">
        <div className="stroop-game__progress-bar" style={{ width: `${(played / ROUNDS) * 100}%` }} />
        <span>Ronda {Math.min(played + 1, ROUNDS)} de {ROUNDS}</span>
      </div>

      <p className="stroop-game__hint">Selecciona el <strong>color de la tinta</strong>, no la palabra</p>

      <div className="stroop-game__word" style={{ color: inkHex }}>
        {word || '...'}
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
    </div>
  );
}
