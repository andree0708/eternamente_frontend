export type GameType = 'memory' | 'stroop' | 'navigation' | 'whackamole';

export interface GameInfo {
  name: string;
  icon: string;
  color: string;
  evaluates: string;
}

const GAMES: Record<GameType, GameInfo> = {
  memory: {
    name: 'Memoria de Pares',
    icon: '🧠',
    color: '#667eea',
    evaluates: 'Memoria de trabajo y atención',
  },
  stroop: {
    name: 'Test de Stroop',
    icon: '🎨',
    color: '#f093fb',
    evaluates: 'Control inhibitorio y flexibilidad cognitiva',
  },
  navigation: {
    name: 'Navegación Espacial',
    icon: '🧭',
    color: '#4facfe',
    evaluates: 'Orientación espacial y memoria de rutas',
  },
  whackamole: {
    name: 'Whack-a-Mole',
    icon: '🐹',
    color: '#fa709a',
    evaluates: 'Control inhibitorio (Go/No-Go) y tiempo de reacción',
  },
};

export function getGameInfo(assessment: {
  gameType?: string;
  metrics?: Record<string, unknown>;
}): GameInfo {
  const type = (assessment.gameType || assessment.metrics?.gameType) as GameType | undefined;
  if (type && GAMES[type]) {
    return GAMES[type];
  }
  const metrics = assessment.metrics;
  if (metrics?.matchedPairs !== undefined) return GAMES.memory;
  if (metrics?.achievedLevel !== undefined) return GAMES.navigation;
  if (metrics?.totalRounds !== undefined && metrics?.averageReactionTimeMs !== undefined) {
    return metrics?.maxLevel !== undefined ? GAMES.navigation : GAMES.stroop;
  }
  return { name: 'Juego Cognitivo', icon: '🎮', color: '#666', evaluates: 'Funciones cognitivas' };
}
