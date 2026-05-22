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
}

export function ResultsPanel({ visible, lastAssessmentId, gameCompleted }: Props) {
  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [loading, setLoading] = useState(false);
  const [analysisHtml, setAnalysisHtml] = useState<string | null>(null);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadAnalysis = useCallback(async () => {
    if (!lastAssessmentId || !gameCompleted) return;
    setLoading(true);
    setAnalysisHtml(null);
    try {
      const latest = await api<Assessment>(`/api/assessments/${lastAssessmentId}`, 'GET');
      let text = 'No se pudo obtener el análisis detallado.';
      try {
        const detailed = await api<{ analysis?: string }>(`/api/assessments/${lastAssessmentId}/analysis`, 'GET');
        if (detailed?.analysis) text = detailed.analysis;
      } catch {
        /* fallback */
      }
      setAnalysisHtml(`
        <div class="results-panel__row">
          <span>Riesgo cognitivo</span>
          <strong>${(latest.riskScore * 100).toFixed(1)}%</strong>
        </div>
        <div class="results-panel__row">
          <span>Predicción</span>
          <strong class="${latest.predictedDcl ? 'risk' : 'ok'}">${latest.predictedDcl ? 'Riesgo detectado' : 'Normal'}</strong>
        </div>
        <div class="results-panel__row">
          <span>Fecha</span>
          <strong>${new Date(latest.createdAt).toLocaleDateString('es-ES')}</strong>
        </div>
        <div class="results-panel__analysis">
          <h4>Análisis con IA</h4>
          <p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</p>
        </div>
      `);
    } catch {
      setAnalysisHtml('<p class="results-panel__error">Error al cargar el análisis</p>');
    } finally {
      setLoading(false);
    }
  }, [lastAssessmentId, gameCompleted]);

  const loadHistory = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (tab === 'history' && visible) loadHistory();
  }, [tab, visible, loadHistory]);

  if (!visible) {
    return (
      <aside className="results-panel results-panel--locked">
        <h2>Resultados</h2>
        <p>Completa la partida para desbloquear tu análisis personalizado.</p>
      </aside>
    );
  }

  return (
    <aside className="results-panel">
      <h2>Resultados de evaluación</h2>
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
          <button
            type="button"
            className="btn btn-outline btn-full"
            onClick={loadAnalysis}
            disabled={loading || !lastAssessmentId}
          >
            {loading ? 'Generando análisis...' : 'Ver análisis completo'}
          </button>
          {analysisHtml && <div className="results-panel__details" dangerouslySetInnerHTML={{ __html: analysisHtml }} />}
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
          <a href="/history" className="results-panel__link">Ver historial completo →</a>
        </div>
      )}
    </aside>
  );
}
