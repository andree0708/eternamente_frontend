import type { CSSProperties } from 'react';

interface Props {
  labels: [string, string, string];
  values: [string | number, string | number, string | number];
  accent: string;
}

export function GameStatsBar({ labels, values, accent }: Props) {
  return (
    <div className="game-stats-bar" style={{ '--game-accent': accent } as CSSProperties}>
      {labels.map((label, i) => (
        <div key={label} className="game-stats-bar__item">
          <span className="game-stats-bar__value">{values[i]}</span>
          <span className="game-stats-bar__label">{label}</span>
        </div>
      ))}
    </div>
  );
}
