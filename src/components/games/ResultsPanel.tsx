import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getGameInfo } from '../../lib/games';

interface Assessment {
  id: string;
  riskScore: number;
  predictedDcl: boolean;
  createdAt: string;
  gameType?: string;
  metrics?: Record<string, unknown>;
}

interface Props {
  visible: boolean;
  lastAssessmentId: string | null;
  gameCompleted: boolean;
  saved: boolean;
}

export function ResultsPanel({ visible, lastAssessmentId, gameCompleted, saved }: Props) {
  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    risk: string;
    prediction: string;
    date: string;
    text: string;
  } | null>(null);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const canShowAnalysis = visible && gameCompleted && saved && !!lastAssessmentId;

  useEffect(() => {
    if (!visible) {
      setAnalysis(null);
      setTab('current');
    }
  }, [visible]);

  const loadAnalysis = useCallback(async () => {
    if (!canShowAnalysis || !lastAssessmentId) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const latest = await api<Assessment>(`/api/assessments/${lastAssessmentId}`, 'GET');
      let text = 'No se pudo obtener el análisis detallado.';
      try {
        const detailed = await api<{ analysis?: string }>(
          `/api/assessments/${lastAssessmentId}/analysis`,
          'GET'
        );
        if (detailed?.analysis) text = detailed.analysis;
      } catch {
        /* fallback */
      }
      setAnalysis({
        risk: `${(latest.riskScore * 100).toFixed(1)}%`,
        prediction: latest.predictedDcl ? 'Riesgo detectado' : 'Normal',
        date: new Date(latest.createdAt).toLocaleDateString('es-ES'),
        text,
      });
    } catch {
      setAnalysis({
        risk: '—',
        prediction: '—',
        date: '—',
        text: 'Error al cargar el análisis. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  }, [canShowAnalysis, lastAssessmentId]);

  const loadHistory = useCallback(async () => {
    if (!visible) return;
    setHistoryLoading(true);
    try {
      const list = await api<Assessment[]>('/api/assessments', 'GET');
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(list);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (tab === 'history' && visible) loadHistory();
  }, [tab, visible, loadHistory]);

  if (!visible) {
    return (
      <aside className="results-panel results-panel--locked">
        <div className="results-panel__lock-icon">🔒</div>
        <h2>Resultados</h2>
        <p>Completa la partida para desbloquear tu análisis personalizado.</p>
      </aside>
    );
  }

  return (
    <aside className="results-panel">
      <h2>Resultados de evaluación</h2>
      {!saved && gameCompleted && (
        <p className="results-panel__saving">Guardando partida...</p>
      )}
      {saved && (
        <p className="results-panel__saved">✓ Partida guardada correctamente</p>
      )}

      <div className="results-panel__tabs">
        <button type="button" className={tab === 'current' ? 'active' : ''} onClick={() => setTab('current')}>
          Partida actual
        </button>
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          Historial rápido
        </button>
      </div>

      {tab === 'current' ? (
        <div className="results-panel__content">
          {canShowAnalysis ? (
            <>
              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={loadAnalysis}
                disabled={loading}
              >
                {loading ? 'Generando análisis...' : 'Ver análisis completo'}
              </button>
              {analysis && (
                <div className="results-panel__details">
                  <div className="results-panel__row">
                    <span>Riesgo cognitivo</span>
                    <strong>{analysis.risk}</strong>
                  </div>
                  <div className="results-panel__row">
                    <span>Predicción</span>
                    <strong>{analysis.prediction}</strong>
                  </div>
                  <div className="results-panel__row">
                    <span>Fecha</span>
                    <strong>{analysis.date}</strong>
                  </div>
                  <div className="results-panel__analysis">
                    <h4>Análisis con IA</h4>
                    {analysis.text.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="results-panel__wait">
              {gameCompleted ? 'Esperando confirmación del guardado...' : 'Termina el juego para ver el análisis.'}
            </p>
          )}
        </div>
      ) : (
        <div className="results-panel__history">
          {historyLoading && <p>Cargando...</p>}
          {!historyLoading && history.length === 0 && <p>No hay partidas aún.</p>}
          {history.slice(0, 8).map((a) => {
            const g = getGameInfo(a);
            return (
              <a key={a.id} href="/history" className="results-panel__history-item">
                <span>{g.icon} {g.name}</span>
                <span>{(a.riskScore * 100).toFixed(0)}% riesgo</span>
              </a>
            );
          })}
          <a href="/history" className="results-panel__link">
            Ver historial completo →
          </a>
        </div>
      )}
    </aside>
  );
}
