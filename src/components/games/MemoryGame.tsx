import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';
import { useGameConfig } from '../../hooks/useGameConfig';

const SYMBOLS = ['★', '♥', '♦', '♣', '♠', '✿', '☀', '☁', '🌙', '🔔', '🍀', '⭐'];

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface Card {
  id: number;
  symbol: string;
  revealed: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(pairs: number): Card[] {
  const selected = SYMBOLS.slice(0, pairs);
  const deck = [...selected, ...selected];
  return shuffle(deck).map((symbol, id) => ({
    id,
    symbol,
    revealed: false,
    matched: false,
  }));
}

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, string]) => void;
}

export function MemoryGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.memory;
  const { settings } = useGameConfig('memory');
  const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; cols: number; label: string }> = {
    EASY: { pairs: settings.pairsEasy, cols: settings.colsEasy, label: `Fácil (${settings.pairsEasy} pares)` },
    MEDIUM: { pairs: settings.pairsMedium, cols: settings.colsMedium, label: `Medio (${settings.pairsMedium} pares)` },
    HARD: { pairs: settings.pairsHard, cols: settings.colsHard, label: `Difícil (${settings.pairsHard} pares)` },
  };
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const config = DIFFICULTY_CONFIG[difficulty];

  const [cards, setCards] = useState<Card[]>(() => buildDeck(config.pairs));
  const [firstPick, setFirstPick] = useState<number | null>(null);
  const [secondPick, setSecondPick] = useState<number | null>(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [moves, setMoves] = useState(0);
  const [mismatches, setMismatches] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const startAtRef = useRef(performance.now());
  const revealTimesRef = useRef<number[]>([]);
  const completedRef = useRef(false);
  const pickStartRef = useRef<number>(0);

  const resetGame = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    setCards(buildDeck(cfg.pairs));
    setFirstPick(null);
    setSecondPick(null);
    setLockBoard(false);
    setMoves(0);
    setMismatches(0);
    setMatchedPairs(0);
    setFinished(false);
    completedRef.current = false;
    startAtRef.current = performance.now();
    revealTimesRef.current = [];
    pickStartRef.current = performance.now();
  }, []);

  useEffect(() => {
    resetGame(difficulty);
  }, [difficulty, resetGame]);

  useEffect(() => {
    onStatsChange?.([moves, mismatches, `${matchedPairs}/${config.pairs}`]);
  }, [moves, mismatches, matchedPairs, config.pairs, onStatsChange]);

  const resolvingRef = useRef(false);

  useEffect(() => {
    if (firstPick === null || secondPick === null || lockBoard || resolvingRef.current) return;

    const first = cards[firstPick];
    const second = cards[secondPick];
    if (!first?.revealed || !second?.revealed) return;

    resolvingRef.current = true;
    const reaction = performance.now() - pickStartRef.current;
    revealTimesRef.current.push(reaction);

    if (first.symbol === second.symbol) {
      setCards((prev) =>
        prev.map((c, i) =>
          i === firstPick || i === secondPick ? { ...c, matched: true, revealed: true } : c
        )
      );
      setMatchedPairs((p) => {
        const next = p + 1;
        if (next >= config.pairs && !completedRef.current) {
          completedRef.current = true;
          setFinished(true);
          const duration = (performance.now() - startAtRef.current) / 1000;
          const avg =
            revealTimesRef.current.length > 0
              ? revealTimesRef.current.reduce((a, b) => a + b, 0) / revealTimesRef.current.length
              : 0;
          queueMicrotask(() =>
            onComplete({
              gameType: 'memory',
              difficulty,
              totalPairs: config.pairs,
              matchedPairs: next,
              moves,
              mismatches,
              durationSeconds: Number(duration.toFixed(2)),
              averageRevealMs: Number(avg.toFixed(2)),
              accuracy: Number((next / config.pairs).toFixed(4)),
              reactionTimeMs: Number(avg.toFixed(2)),
            })
          );
        }
        return next;
      });
      setFirstPick(null);
      setSecondPick(null);
      resolvingRef.current = false;
      return;
    }

    setMismatches((m) => m + 1);
    setLockBoard(true);
    setTimeout(() => {
      setCards((prev) =>
        prev.map((c, i) =>
          i === firstPick || i === secondPick ? { ...c, revealed: false } : c
        )
      );
      setFirstPick(null);
      setSecondPick(null);
      setLockBoard(false);
      resolvingRef.current = false;
      pickStartRef.current = performance.now();
    }, 750);
  }, [firstPick, secondPick, cards, lockBoard, config.pairs, difficulty, moves, mismatches, onComplete]);

  const handleCardClick = (index: number) => {
    if (lockBoard || finished) return;
    const card = cards[index];
    if (!card || card.matched || card.revealed) return;

    if (firstPick === null) {
      pickStartRef.current = performance.now();
      setCards((prev) =>
        prev.map((c, i) => (i === index ? { ...c, revealed: true } : c))
      );
      setFirstPick(index);
      return;
    }

    if (firstPick === index) return;

    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, revealed: true } : c))
    );
    setSecondPick(index);
    setMoves((m) => m + 1);
  };

  const changeDifficulty = (d: Difficulty) => {
    if (lockBoard || d === difficulty) return;
    setDifficulty(d);
  };

  if (finished) {
    return (
      <GameCompleteBanner
        stats={[
          { label: 'Movimientos', value: String(moves) },
          { label: 'Errores', value: String(mismatches) },
          { label: 'Pares', value: `${matchedPairs}/${config.pairs}` },
          { label: 'Dificultad', value: config.label },
        ]}
        onBack={() => { window.location.href = '/games'; }}
      />
    );
  }

  return (
    <div className="memory-game">
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
      <div className="memory-game__difficulty">
        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            className={difficulty === d ? 'active' : ''}
            onClick={() => changeDifficulty(d)}
            disabled={lockBoard}
          >
            {DIFFICULTY_CONFIG[d].label}
          </button>
        ))}
      </div>

      <p className="memory-game__hint">
        {config.pairs * 2} cartas · {config.cols} columnas
      </p>

      <div
        className="memory-game__board"
        style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(56px, 1fr))` }}
      >
        {cards.map((card, index) => (
          <button
            key={`${difficulty}-${card.id}-${index}`}
            type="button"
            className={`memory-game__card ${card.revealed ? 'revealed' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => handleCardClick(index)}
            disabled={lockBoard || card.matched}
            aria-label={card.matched || card.revealed ? card.symbol : 'Carta oculta'}
          >
            <span className="memory-game__card-inner">
              {card.revealed || card.matched ? card.symbol : '?'}
            </span>
          </button>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
