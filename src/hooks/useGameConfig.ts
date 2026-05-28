import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DEFAULT_GAME_SETTINGS, type GameType } from '../lib/games';

export function useGameConfig(gameType: GameType) {
  const defaults = DEFAULT_GAME_SETTINGS[gameType];
  const [settings, setSettings] = useState<Record<string, number>>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ settings: Record<string, number> }>(`/api/game-config/${gameType}`, 'GET')
      .then((res) => {
        if (cancelled) return;
        const merged = { ...defaults };
        for (const [key, value] of Object.entries(res.settings || {})) {
          if (typeof value === 'number') merged[key] = value;
        }
        setSettings(merged);
      })
      .catch(() => {
        if (!cancelled) setSettings(defaults);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameType]);

  return { settings, loading };
}
