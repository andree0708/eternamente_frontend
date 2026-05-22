import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GameStatsBar } from './GameStatsBar';
import { GAME_META } from '../../lib/gameConfig';

const SYMBOLS = ['★', '♥', '♦', '♣', '♠', '✿', '☀', '☁', '🌙', '🔔', '🍀', '⭐'];

interface Card {
  id: number;
  symbol: string;
  revealed: boolean;
  matched: boolean;
  openedAt: number | null;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, string]) => void;
}

export function MemoryGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.memory;
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const totalPairs = difficulty === 'EASY' ? 6 : difficulty === 'MEDIUM' ? 8 : 10;
  const [cards, setCards] = useState<Card[]>([]);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [lockBoard, setLockBoard] = useState(false);
  const [moves, setMoves] = useState(0);
  const [mismatches, setMismatches] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [revealDurations, setRevealDurations] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const completedRef = useRef(false);

  const createDeck = useCallback(() => {
    const pairs = [...SYMBOLS.slice(0, totalPairs), ...SYMBOLS.slice(0, totalPairs)];
    return shuffle(pairs).map((symbol, id) => ({
      id,
      symbol,
      revealed: false,
      matched: false,
      openedAt: null,
    }));
  }, [totalPairs]);

  const newGame = useCallback(() => {
    setStartAt(performance.now());
    setMoves(0);
    setMismatches(0);
    setMatchedPairs(0);
    setRevealDurations([]);
    setOpenIndexes([]);
    setLockBoard(false);
    setFinished(false);
    completedRef.current = false;
    setCards(createDeck());
  }, [createDeck]);

  useEffect(() => {
    newGame();
  }, [newGame]);

  useEffect(() => {
    onStatsChange?.([moves, mismatches, `${matchedPairs}/${totalPairs}`]);
  }, [moves, mismatches, matchedPairs, totalPairs, onStatsChange]);

  useEffect(() => {
    if (matchedPairs < totalPairs || finished || !startAt || completedRef.current) return;
    completedRef.current = true;
    setFinished(true);
    const endAt = performance.now();
    const avg = revealDurations.length
      ? revealDurations.reduce((x, y) => x + y, 0) / revealDurations.length
      : 0;
    onComplete({
      gameType: 'memory',
      difficulty,
      totalPairs,
      matchedPairs,
      moves,
      mismatches,
      durationSeconds: Number(((endAt - startAt) / 1000).toFixed(2)),
      averageRevealMs: Number(avg.toFixed(2)),
      accuracy: Number((matchedPairs / totalPairs).toFixed(4)),
      reactionTimeMs: Number(avg.toFixed(2)),
    });
  }, [matchedPairs, totalPairs, finished, startAt, moves, mismatches, difficulty, revealDurations, onComplete]);

  const flipCard = (index: number) => {
    if (lockBoard || finished) return;
    setCards((prev) => {
      const card = prev[index];
      if (!card || card.revealed || card.matched) return prev;
      const next = prev.map((c, i) =>
        i === index ? { ...c, revealed: true, openedAt: performance.now() } : c
      );
      const newOpen = [...openIndexes, index];
      setOpenIndexes(newOpen);
      if (newOpen.length < 2) return next;

      const [a, b] = newOpen;
      const first = next[a];
      const second = next[b];
      setMoves((m) => m + 1);

      if (startAt && first.openedAt && second.openedAt) {
        setRevealDurations((d) => [
          ...d,
          first.openedAt! - startAt,
          second.openedAt! - startAt,
        ]);
      }

      if (first.symbol === second.symbol) {
        const matched = next.map((c, i) =>
          i === a || i === b ? { ...c, matched: true } : c
        );
        setOpenIndexes([]);
        setMatchedPairs((p) => p + 1);
        return matched;
      }

      setMismatches((m) => m + 1);
      setLockBoard(true);
      setTimeout(() => {
        setCards((c) =>
          c.map((card, i) => (i === a || i === b ? { ...card, revealed: false } : card))
        );
        setOpenIndexes([]);
        setLockBoard(false);
      }, 700);
      return next;
    });
  };

  if (finished) {
    return (
      <GameCompleteBanner
        stats={[
          { label: 'Movimientos', value: String(moves) },
          { label: 'Errores', value: String(mismatches) },
          { label: 'Pares', value: `${matchedPairs}/${totalPairs}` },
        ]}
        onBack={() => { window.location.href = '/games'; }}
      />
    );
  }

  const cols = totalPairs <= 6 ? 4 : totalPairs <= 8 ? 4 : 5;

  return (
    <div className="memory-game">
      <GameInstructions
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        accent={meta.accent}
        collapsed={!instructionsOpen}
        onToggle={() => setInstructionsOpen((o) => !o)}
      />

      <div className="memory-game__difficulty">
        {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
          <button
            key={d}
            type="button"
            className={difficulty === d ? 'active' : ''}
            onClick={() => setDifficulty(d)}
          >
            {d === 'EASY' ? 'Fácil' : d === 'MEDIUM' ? 'Medio' : 'Difícil'}
          </button>
        ))}
      </div>

      <div
        className="memory-game__board"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(64px, 1fr))` }}
      >
        {cards.map((card, index) => (
          <button
            key={`${card.id}-${index}`}
            type="button"
            className={`memory-game__card ${card.revealed ? 'revealed' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => flipCard(index)}
            disabled={lockBoard || card.revealed || card.matched}
          >
            <span className="memory-game__card-inner">
              {card.revealed || card.matched ? card.symbol : '?'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
