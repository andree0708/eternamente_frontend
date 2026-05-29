import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getGameCatalog } from '../../lib/games';
import type { GameInfo } from '../../lib/games';
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

function pctClass(v: number): string {
  if (v <= 33) return 'dash__cell-pct--low';
  if (v <= 66) return 'dash__cell-pct--mid';
  return 'dash__cell-pct--high';
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
  const totalFromGames = analytics?.byGameType.reduce((s, g) => s + g.sessions, 0) || 0;
  const totalSessions = Math.max(analytics?.summary.totalSessions || 0, totalFromGames);
  const riskPct = totalSessions > 0
    ? Math.round(((analytics?.byGameType.reduce((sum, g) => sum + g.avgRiskScore * g.sessions, 0) || 0) / totalSessions) * 100)
    : 0;
  const maxSessions = Math.max(1, ...(analytics?.byGameType.map((g) => g.sessions) || [1]));
  const totalAcc = analytics?.summary.avgAccuracy != null ? Math.round(analytics.summary.avgAccuracy * 100) : null;

  function gameInfo(type: string): GameInfo | undefined {
    return catalog.find((g) => g.type === type);
  }

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

      <section className="dash__section" aria-labelledby="metrics-title">
        <h2 id="metrics-title">Resumen de métricas</h2>
        {loading ? (
          <p className="dash__loading">Cargando analítica…</p>
        ) : analytics && totalSessions > 0 ? (
          <>
            <div className="dash__metrics-vertical">
              <div className="dash__metric-card">
                <span className="dash__metric-icon">📊</span>
                <div>
                  <span className="dash__metric-value">{totalSessions}</span>
                  <span className="dash__metric-label">Sesiones totales</span>
                </div>
              </div>
              <div className="dash__metric-card">
                <span className="dash__metric-icon">⚠️</span>
                <div>
                  <span className={`dash__metric-value ${pctClass(riskPct)}`}>{riskPct}%</span>
                  <span className="dash__metric-label">Riesgo promedio</span>
                </div>
              </div>
              <div className="dash__metric-card">
                <span className="dash__metric-icon">🎯</span>
                <div>
                  {totalAcc != null ? (
                    <>
                      <span className={`dash__metric-value ${pctClass(totalAcc)}`}>{totalAcc}%</span>
                      <span className="dash__metric-label">Precisión promedio</span>
                    </>
                  ) : (
                    <>
                      <span className="dash__metric-value" style={{ color: 'var(--color-text-muted)' }}>—</span>
                      <span className="dash__metric-label">Precisión promedio</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {analytics.riskTrend.length > 1 && (
              <div className="dash__trend-section">
                <h3>Evolución de riesgo</h3>
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
              </div>
            )}

            <h3 className="dash__table-title">Analítica de datos</h3>
            <div className="dash__bars-vertical">
              {analytics.byGameType.map((row) => {
                const info = gameInfo(row.gameType);
                const rpct = Math.round(row.avgRiskScore * 100);
                const apct = row.avgAccuracy != null ? Math.round(row.avgAccuracy * 100) : null;
                const fillHeight = Math.round((row.sessions / maxSessions) * 100);
                return (
                  <div key={row.gameType} className="dash__bar-col">
                    <div className="dash__bar-col-stats">
                      <span className="dash__bar-col-stat">{rpct}%</span>
                      <span className="dash__bar-col-divider" />
                      {apct != null
                        ? <span className={`dash__bar-col-stat ${pctClass(apct)}`}>{apct}%</span>
                        : <span className="dash__bar-col-stat" style={{ color: 'var(--color-text-muted)' }}>—</span>
                      }
                    </div>
                    <div className="dash__col-track">
                      <div
                        className="dash__col-fill"
                        style={{ height: `${fillHeight}%`, background: info?.color || '#888' }}
                      />
                    </div>
                    <div className="dash__bar-col-label">
                      <span className="dash__bar-icon-tiny" style={{ background: info?.color + '22', color: info?.color }}>{info?.icon || '?'}</span>
                      <span className="dash__bar-col-name">{info?.name || row.gameType}</span>
                      <span className="dash__bar-col-sessions">{row.sessions}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="dash__empty">
            Aún no hay datos. Completa tu primera partida para ver gráficas aquí.
          </p>
        )}
      </section>

      <section id="juegos" className="dash__section" aria-labelledby="games-title">
        <h2 id="games-title">Juegos cognitivos</h2>
        <p className="dash__games-hint">8 evaluaciones · elige una para comenzar</p>
        <div className="dash__grid dash__grid--4x4">
          {catalog.map((game) => (
            <a
              key={game.type}
              href={`/game?type=${game.type}`}
              className="dash__game-card"
              style={{ '--card-accent': game.color } as React.CSSProperties}
            >
              <span className="dash__game-icon" style={{ background: game.color + '22' }}>
                {game.icon}
                <span className="dash__game-icon-ring" />
              </span>
              <h3>{game.name}</h3>
              <p>{game.evaluates}</p>
              <span className="dash__domain" style={{ background: game.color }}>
                {game.domain}
              </span>
              <span className="dash__game-arrow">→</span>
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
