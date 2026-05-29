interface Props {
  title?: string;
  stats?: { label: string; value: string }[];
  onBack?: () => void;
}

export function GameCompleteBanner({
  title = '¡Partida completada!',
  stats = [],
  onBack = () => { window.location.href = '/games'; },
}: Props) {
  return (
    <div className="game-complete">
      <div className="game-complete__icon">🎉</div>
      <h2>{title}</h2>
      {stats.length > 0 && (
        <div className="game-complete__stats">
          {stats.map((s) => (
            <div key={s.label} className="game-complete__stat">
              <span className="game-complete__stat-value">{s.value}</span>
              <span className="game-complete__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
      <p className="game-complete__hint">Tus resultados se guardan en el panel principal.</p>
      <a href="/games" className="btn btn-outline" onClick={(e) => { e.preventDefault(); onBack(); }}>
        Volver al menú
      </a>
    </div>
  );
}
