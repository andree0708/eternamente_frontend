import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api';
import { ALL_GAME_TYPES, getGameInfo, type GameType } from '../../lib/games';
import '../../styles/history.css';

interface Assessment {
  id: string;
  riskScore: number;
  predictedDcl: boolean;
  createdAt: string;
  gameType?: string;
  metrics?: Record<string, unknown>;
}

interface Summary {
  totalSessions: number;
  avgRiskScore: number;
  avgAccuracy: number | null;
  memorySessions: number;
  stroopSessions: number;
  navigationSessions: number;
  whackamoleSessions: number;
}

const FILTERS: { id: 'all' | GameType; label: string }[] = [
  { id: 'all', label: 'Todos' },
  ...ALL_GAME_TYPES.map((id) => {
    const info = getGameInfo({ gameType: id });
    return { id, label: `${info.icon} ${info.name}` };
  }),
];

export function HistoryPage() {
  const [user, setUser] = useState<{ fullName?: string; email?: string } | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<'all' | GameType>('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<Record<string, string>>({});

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        api<Assessment[]>('/api/assessments', 'GET'),
        api<Summary>('/api/assessments/summary', 'GET'),
      ]);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAssessments(list);
      setSummary(sum.totalSessions > 0 ? sum : null);
    } catch {
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = assessments.filter((a) => {
    if (filter === 'all') return true;
    const type = (a.gameType || a.metrics?.gameType) as string;
    return type === filter;
  });

  const loadAnalysis = async (id: string) => {
    if (analysisText[id]) {
      setExpandedId(expandedId === id ? null : id);
      return;
    }
    setAnalysisLoading(id);
    setExpandedId(id);
    try {
      const res = await api<{ analysis?: string }>(`/api/assessments/${id}/analysis`, 'GET');
      setAnalysisText((prev) => ({ ...prev, [id]: res.analysis || 'Sin análisis disponible.' }));
    } catch {
      setAnalysisText((prev) => ({ ...prev, [id]: 'No se pudo cargar el análisis.' }));
    } finally {
      setAnalysisLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="history-app">
      <header className="history-app__header">
        <a href="/games" className="history-app__back">← Juegos</a>
        <span className="history-app__user">{user?.fullName || user?.email}</span>
      </header>

      <main className="history-app__main">
        <header className="history-app__title">
          <h1>Mi historial de evaluaciones</h1>
          <p>Todas tus partidas, métricas y análisis cognitivo</p>
        </header>

        {summary && (
          <section className="history-summary">
            <h2>Tu evolución</h2>
            <div className="history-summary__grid">
              <div className="history-summary__stat">
                <span className="value">{summary.totalSessions}</span>
                <span className="label">Partidas</span>
              </div>
              <div className="history-summary__stat">
                <span className="value">{(summary.avgRiskScore * 100).toFixed(0)}%</span>
                <span className="label">Riesgo medio</span>
              </div>
              <div className="history-summary__stat">
                <span className="value">
                  {summary.avgAccuracy != null ? `${(summary.avgAccuracy * 100).toFixed(0)}%` : '—'}
                </span>
                <span className="label">Precisión</span>
              </div>
            </div>
            <div className="history-summary__games">
              <span>🧠 {summary.memorySessions}</span>
              <span>🎨 {summary.stroopSessions}</span>
              <span>🧭 {summary.navigationSessions}</span>
              <span>🐹 {summary.whackamoleSessions}</span>
            </div>
          </section>
        )}

        <div className="history-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? 'active' : ''}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="history-loading">
            <div className="spinner" />
            <p>Cargando historial...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="history-empty">
            <p>No hay evaluaciones en este filtro.</p>
            <a href="/games" className="btn btn-primary">Jugar ahora</a>
          </div>
        )}

        <div className="history-cards">
          {filtered.map((a) => {
            const game = getGameInfo(a);
            const m = a.metrics || {};
            const risk = (a.riskScore * 100).toFixed(0);
            const isOpen = expandedId === a.id;

            return (
              <article
                key={a.id}
                className="history-card"
                style={{ '--accent': game.color } as CSSProperties}
              >
                <div className="history-card__top">
                  <div className="history-card__game">
                    <span className="history-card__icon">{game.icon}</span>
                    <div>
                      <h3>{game.name}</h3>
                      <time>{formatDate(a.createdAt)}</time>
                    </div>
                  </div>
                  <span className={`history-card__badge ${a.predictedDcl ? 'risk' : 'ok'}`}>
                    {a.predictedDcl ? '⚠ Riesgo' : '✓ Normal'}
                  </span>
                </div>

                <div className="history-card__metrics">
                  <div><strong>{risk}%</strong><span>Riesgo</span></div>
                  {m.accuracy != null && (
                    <div><strong>{((m.accuracy as number) * 100).toFixed(0)}%</strong><span>Precisión</span></div>
                  )}
                  {m.averageReactionTimeMs != null && (
                    <div><strong>{Math.round(m.averageReactionTimeMs as number)}ms</strong><span>Reacción</span></div>
                  )}
                  {m.achievedLevel != null && (
                    <div><strong>{String(m.achievedLevel)}/{String(m.maxLevel || 5)}</strong><span>Nivel</span></div>
                  )}
                  {m.correct != null && (
                    <div><strong>{String(m.correct)}</strong><span>Aciertos</span></div>
                  )}
                </div>

                <p className="history-card__evaluates">{game.evaluates}</p>

                <button
                  type="button"
                  className="history-card__analysis-btn"
                  onClick={() => loadAnalysis(a.id)}
                  disabled={analysisLoading === a.id}
                >
                  {analysisLoading === a.id
                    ? 'Cargando análisis...'
                    : isOpen && analysisText[a.id]
                      ? 'Ocultar análisis'
                      : 'Ver análisis con IA'}
                </button>

                {isOpen && analysisText[a.id] && (
                  <div className="history-card__analysis">
                    {analysisText[a.id].split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
