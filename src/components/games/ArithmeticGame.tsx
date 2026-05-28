import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameConfig } from '../../hooks/useGameConfig';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

function makeProblem(maxOperand: number) {
  const a = Math.floor(Math.random() * maxOperand) + 1;
  const b = Math.floor(Math.random() * maxOperand) + 1;
  const add = Math.random() > 0.4;
  const result = add ? a + b : Math.max(a, b) - Math.min(a, b);
  const label = add ? `${a} + ${b}` : `${Math.max(a, b)} − ${Math.min(a, b)}`;
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const delta = Math.floor(Math.random() * 5) - 2;
    const w = result + delta;
    if (w >= 0 && w !== result) wrong.add(w);
  }
  const options = [result, ...wrong].sort(() => Math.random() - 0.5);
  return { label, answer: result, options };
}

export function ArithmeticGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.arithmetic;
  const { settings } = useGameConfig('arithmetic');
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState(() => makeProblem(settings.maxOperand));
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimitSeconds);
  const [finished, setFinished] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const startRef = useRef(0);
  const savedRef = useRef(false);

  const nextProblem = useCallback(() => {
    setProblem(makeProblem(settings.maxOperand));
    setTimeLeft(settings.timeLimitSeconds);
    startRef.current = performance.now();
  }, [settings.maxOperand, settings.timeLimitSeconds]);

  useEffect(() => {
    if (instructionsOpen || finished) return;
    nextProblem();
  }, [round, instructionsOpen, finished, nextProblem]);

  useEffect(() => {
    if (instructionsOpen || finished || round >= settings.rounds) return;
    if (timeLeft <= 0) {
      setErrors((e) => e + 1);
      setRound((r) => r + 1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, instructionsOpen, finished, round, settings.rounds]);

  useEffect(() => {
    if (round < settings.rounds || finished) return;
    setFinished(true);
  }, [round, settings.rounds, finished]);

  useEffect(() => {
    onStatsChange?.([correct, errors, Math.round(
      reactionTimes.length ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0
    )]);
  }, [correct, errors, reactionTimes, onStatsChange]);

  const pick = (value: number) => {
    if (finished) return;
    const rt = performance.now() - startRef.current;
    if (value === problem.answer) {
      setCorrect((c) => c + 1);
      setReactionTimes((t) => [...t, rt]);
      setFlash('ok');
    } else {
      setErrors((e) => e + 1);
      setFlash('bad');
    }
    setTimeout(() => setFlash(null), 400);
    setRound((r) => r + 1);
  };

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    const avg =
      reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;
    onComplete({
      gameType: 'arithmetic',
      totalRounds: settings.rounds,
      correct,
      errors,
      accuracy: Number((correct / settings.rounds).toFixed(4)),
      averageReactionTimeMs: Number(avg.toFixed(2)),
    });
  }, [finished, correct, errors, reactionTimes, settings.rounds, onComplete]);

  return (
    <div className={`arith-game ${flash ? `arith-game--${flash}` : ''}`}>
      <GameInstructions
        open={instructionsOpen}
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        onStart={() => setInstructionsOpen(false)}
      />
      {!instructionsOpen && !finished && (
        <>
          <p className="arith-game__meta">
            Pregunta {Math.min(round + 1, settings.rounds)} de {settings.rounds} · Tiempo: {timeLeft}s
          </p>
          <div className="arith-game__expr">{problem.label} = ?</div>
          <div className="arith-game__options">
            {problem.options.map((opt) => (
              <button key={opt} type="button" className="arith-game__opt" onClick={() => pick(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
      {finished && <GameCompleteBanner />}
    </div>
  );
}
