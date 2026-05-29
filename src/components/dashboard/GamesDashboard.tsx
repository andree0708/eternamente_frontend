import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getGameCatalog } from '../../lib/games';
import '../../styles/dashboard.css';

interface Analytics {
  summary: {
    totalSessions: number;
    avgRiskScore: number;
    avgAccuracy: number | null;
    lastPlayedAt: string | null;
  };
  byGameType: Array<{
    gameType: string;
    sessions: number;
    avgRiskScore: number;
    avgAccuracy: number | null;
  }>;
  riskTrend: Array<{ playedAt: string; riskScore: number; gameType: string }>;
}

export function GamesDashboard() {
  const [user, setUser] = useState<{ fullName?: string; email?: string } | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eternamente_token');
    const raw = localStorage.getItem('eternamente_user');
    if (!token || !raw) {
      window.location.href = '/';
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      window.location.href = '/';
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Analytics>('/api/assessments/analytics', 'GET');
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const logout = () => {
    localStorage.removeItem('eternamente_token');
    localStorage.removeItem('eternamente_user');
    window.location.href = '/';
  };

  const catalog = getGameCatalog();
  const maxSessions = Math.max(1, ...(analytics?.byGameType.map((g) => g.sessions) || [1]));
  const riskPct = analytics ? Math.round(analytics.summary.avgRiskScore * 100) : 0;
  const accuracyPct =
    analytics?.summary.avgAccuracy != null
      ? Math.round(analytics.summary.avgAccuracy * 100)
      : null;

  return (
    <div className="dash">
      <header className="dash__welcome">
        <div>
          <h1>Hola, {user?.fullName || user?.email || 'Usuario'}</h1>
          <p className="dash__subtitle">
            Panel de evaluación cognitiva · Los resultados son orientativos y no sustituyen una
            evaluación médica.
          </p>
        </div>
        <button type="button" className="dash__logout" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <section className="dash__analytics" aria-labelledby="analytics-title">
        <h2 id="analytics-title">Tu resumen</h2>
        {loading ? (
          <p className="dash__loading">Cargando analítica…</p>
        ) : analytics && analytics.summary.totalSessions > 0 ? (
          <>
            <div className="dash__stats">
              <div className="dash__stat-card">
                <span className="dash__stat-value">{analytics.summary.totalSessions}</span>
                <span className="dash__stat-label">Sesiones</span>
              </div>
              <div className="dash__stat-card">
                <span className="dash__stat-value">{riskPct}%</span>
                <span className="dash__stat-label">Índice de riesgo medio</span>
              </div>
              {accuracyPct != null && (
                <div className="dash__stat-card">
                  <span className="dash__stat-value">{accuracyPct}%</span>
                  <span className="dash__stat-label">Precisión media</span>
                </div>
              )}
            </div>

            <h3 className="dash__chart-title">Sesiones por juego</h3>
            <ul className="dash__bars">
              {analytics.byGameType.map((row) => {
                const info = catalog.find((g) => g.type === row.gameType);
                const width = Math.round((row.sessions / maxSessions) * 100);
                return (
                  <li key={row.gameType}>
                    <span className="dash__bar-label">
                      {info?.icon} {info?.name || row.gameType}
                    </span>
                    <div className="dash__bar-track">
                      <div
                        className="dash__bar-fill"
                        style={{ width: `${width}%`, background: info?.color || '#888' }}
                      />
                    </div>
                    <span className="dash__bar-count">{row.sessions}</span>
                  </li>
                );
              })}
            </ul>

            {analytics.riskTrend.length > 1 && (
              <>
                <h3 className="dash__chart-title">Últimas partidas (riesgo)</h3>
                <div className="dash__trend">
                  {analytics.riskTrend.map((point, i) => (
                    <div
                      key={`${point.playedAt}-${i}`}
                      className="dash__trend-bar"
                      style={{ height: `${Math.max(8, point.riskScore * 100)}%` }}
                      title={`${Math.round(point.riskScore * 100)}%`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="dash__empty">
            Aún no hay datos. Completa tu primera partida para ver gráficas aquí.
          </p>
        )}
      </section>

      <section id="juegos" className="dash__games" aria-labelledby="games-title">
        <h2 id="games-title">Juegos cognitivos</h2>
        <p className="dash__games-hint">8 evaluaciones · elige una para comenzar</p>
        <div className="dash__grid dash__grid--4x4">
          {catalog.map((game) => (
            <a key={game.type} href={`/game?type=${game.type}`} className="dash__game-card">
              <span className="dash__game-icon" style={{ background: game.color }}>
                {game.icon}
              </span>
              <h3>{game.name}</h3>
              <p>{game.evaluates}</p>
              <span className="dash__domain">{game.domain}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="dash__history">
        <a href="/history" className="btn btn-outline btn-full dash__history-btn">
          Ver historial completo de evaluaciones
        </a>
      </section>
    </div>
  );
}
