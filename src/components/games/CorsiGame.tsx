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
  const gridSize = settings.gridSize || 3;
  const cellCount = gridSize * gridSize;
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('watch');
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const savedRef = useRef(false);
  const playingRef = useRef(false);

  const seqLen = 2 + level;
  const maxLevel = settings.maxLevel;

  const playSequence = useCallback(
    async (seq: number[]) => {
      if (playingRef.current) return;
      playingRef.current = true;
      setPhase('watch');
      setFeedbackMsg(null);
      for (const idx of seq) {
        setActiveCell(idx);
        await new Promise((r) => setTimeout(r, settings.flashMs));
        setActiveCell(null);
        await new Promise((r) => setTimeout(r, settings.gapMs));
      }
      setPhase('repeat');
      playingRef.current = false;
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
    if (!started || finished) return;
    startRound();
  }, [level, started, finished, startRound]);

  useEffect(() => {
    onStatsChange?.([level, correctCount, errors]);
  }, [level, correctCount, errors, onStatsChange]);

  const tapCell = (idx: number) => {
    if (phase !== 'repeat' || finished) return;
    const next = [...playerSeq, idx];
    setPlayerSeq(next);
    const expected = sequence[next.length - 1];
    if (idx !== expected) {
      setErrors((e) => e + 1);
      setPhase('feedback');
      setFeedbackMsg(`Secuencia incorrecta. Nivel alcanzado: ${Math.max(0, level - 1)}`);
      setTimeout(() => setFinished(true), 1200);
      return;
    }
    if (next.length === sequence.length) {
      setCorrectCount((c) => c + 1);
      setPhase('feedback');
      setFeedbackMsg('✓ ¡Correcto!');
      if (level >= maxLevel) {
        setTimeout(() => setFinished(true), 800);
      } else {
        setTimeout(() => {
          setLevel((l) => l + 1);
        }, 800);
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

  if (finished) {
    return (
      <div className="corsi-game">
        <GameCompleteBanner
          stats={[
            { label: 'Nivel', value: String(errors > 0 ? Math.max(0, level - 1) : maxLevel) },
            { label: 'Rondas OK', value: String(correctCount) },
            { label: 'Errores', value: String(errors) },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="corsi-game">
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
          <p className="corsi-game__level">Nivel {level} de {maxLevel} · {seqLen} casillas</p>
          {feedbackMsg && (
            <p className={`game-feedback ${feedbackMsg.startsWith('✓') ? 'game-feedback--ok' : 'game-feedback--bad'}`} role="status">
              {feedbackMsg}
            </p>
          )}
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
                disabled={phase === 'watch' || phase === 'feedback'}
              />
            ))}
          </div>
          <p className="corsi-game__phase">
            {phase === 'watch' ? 'Observa la secuencia…' : phase === 'repeat' ? 'Repite el patrón' : '…'}
          </p>
        </>
      )}
    </div>
  );
}
