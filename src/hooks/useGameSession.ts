import { useCallback, useState } from 'react';
import { api } from '../lib/api';
import type { GameType } from '../lib/games';

interface SavedAssessment {
  id: string;
  riskScore: number;
  predictedDcl: boolean;
  createdAt: string;
}

export function useGameSession(gameType: GameType) {
  const [gameCompleted, setGameCompleted] = useState(false);
  const [lastAssessmentId, setLastAssessmentId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [saving, setSaving] = useState(false);

  const resetSession = useCallback(() => {
    setGameCompleted(false);
    setLastAssessmentId(null);
    setSaveMessage(null);
  }, []);

  const completeAndSave = useCallback(async (metrics: Record<string, unknown>) => {
    setGameCompleted(true);
    setSaving(true);
    setSaveMessage({ text: 'Guardando resultados...', type: 'info' });
    try {
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries({ ...metrics, gameType })) {
        if (typeof v === 'number' && !Number.isFinite(v)) continue;
        clean[k] = v;
      }
      const saved = await api<SavedAssessment>('/api/assessments', 'POST', {
        age: 65,
        metrics: clean,
      });
      setLastAssessmentId(saved.id);
      setSaveMessage({ text: '¡Partida guardada correctamente!', type: 'success' });
      return saved.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setSaveMessage({ text: `Error al guardar: ${message}`, type: 'error' });
      return null;
    } finally {
      setSaving(false);
    }
  }, [gameType]);

  return {
    gameCompleted,
    lastAssessmentId,
    saveMessage,
    saving,
    resetSession,
    completeAndSave,
  };
}
