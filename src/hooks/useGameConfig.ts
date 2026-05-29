import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { DEFAULT_GAME_SETTINGS, type GameType } from '../lib/games';

const TIMEOUT_MS = 5000;

export function useGameConfig(gameType: GameType) {
  const defaults = DEFAULT_GAME_SETTINGS[gameType];
  const [settings, setSettings] = useState<Record<string, number>>(defaults);
  const [loading, setLoading] = useState(true);
  const failRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    failRef.current = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      if (!cancelled && !failRef.current) {
        failRef.current = true;
        setSettings(defaults);
        setLoading(false);
      }
    }, TIMEOUT_MS);
    api<{ settings: Record<string, number> }>(`/api/game-config/${gameType}`, 'GET')
      .then((res) => {
        if (cancelled) return;
        clearTimeout(timeout);
        const merged = { ...defaults };
        for (const [key, value] of Object.entries(res.settings || {})) {
          if (typeof value === 'number') merged[key] = value;
        }
        setSettings(merged);
      })
      .catch(() => {
        if (!cancelled && !failRef.current) {
          failRef.current = true;
          clearTimeout(timeout);
          setSettings(defaults);
        }
      })
      .finally(() => {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [gameType]);

  return { settings, loading };
}
