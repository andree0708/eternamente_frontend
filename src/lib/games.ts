export type GameType =
  | 'memory'
  | 'stroop'
  | 'navigation'
  | 'whackamole'
  | 'digitspan'
  | 'corsi'
  | 'orientation'
  | 'arithmetic';

export interface GameInfo {
  name: string;
  icon: string;
  color: string;
  evaluates: string;
  domain: string;
}

export const DEFAULT_GAME_SETTINGS: Record<GameType, Record<string, number>> = {
  memory: { pairsEasy: 6, pairsMedium: 8, pairsHard: 10, colsEasy: 3, colsMedium: 4, colsHard: 4 },
  stroop: { rounds: 20, wordDisplayMs: 4000 },
  navigation: { maxLevel: 5, gridSize: 5 },
  whackamole: { rounds: 30, gridSize: 3, showMs: 1400, distractorChance: 0.35 },
  digitspan: { maxLevel: 5, sequenceStart: 3, displayMsPerDigit: 900, responseTimeoutMs: 12000 },
  corsi: { maxLevel: 5, gridSize: 3, flashMs: 600, gapMs: 400 },
  orientation: { questionsPerSession: 5 },
  arithmetic: { rounds: 15, timeLimitSeconds: 8, maxOperand: 20 },
};

const GAMES: Record<GameType, GameInfo> = {
  memory: {
    name: 'Memorama de Pares',
    icon: '🧠',
    color: '#667eea',
    evaluates: 'Memoria visual y memoria de trabajo',
    domain: 'Memoria',
  },
  stroop: {
    name: 'Stroop de Colores',
    icon: '🎨',
    color: '#f5576c',
    evaluates: 'Control inhibitorio e interferencia cognitiva',
    domain: 'Ejecutivo',
  },
  navigation: {
    name: 'Conecta los Puntos',
    icon: '🧭',
    color: '#4facfe',
    evaluates: 'Planificación y flexibilidad (tipo Trail Making)',
    domain: 'Ejecutivo',
  },
  whackamole: {
    name: 'Flash de Colores',
    icon: '⚡',
    color: '#fa709a',
    evaluates: 'Atención sostenida y Go/No-Go',
    domain: 'Atención',
  },
  digitspan: {
    name: 'Secuencia de Números',
    icon: '🔢',
    color: '#5c6bc0',
    evaluates: 'Memoria de trabajo verbal (span de dígitos)',
    domain: 'Memoria',
  },
  corsi: {
    name: 'Reproduce el Patrón',
    icon: '🔲',
    color: '#26a69a',
    evaluates: 'Memoria visoespacial (tipo Corsi)',
    domain: 'Memoria',
  },
  orientation: {
    name: 'Orientación Temporal',
    icon: '📅',
    color: '#8d6e63',
    evaluates: 'Conciencia de fecha, día y estación',
    domain: 'Orientación',
  },
  arithmetic: {
    name: 'Cálculo Mental',
    icon: '➕',
    color: '#ff8f00',
    evaluates: 'Velocidad de procesamiento y cálculo',
    domain: 'Velocidad',
  },
};

export const ALL_GAME_TYPES: GameType[] = Object.keys(GAMES) as GameType[];

export function getGameInfo(assessment: {
  gameType?: string;
  metrics?: Record<string, unknown>;
}): GameInfo {
  const type = (assessment.gameType || assessment.metrics?.gameType) as GameType | undefined;
  if (type && GAMES[type]) return GAMES[type];
  return {
    name: 'Juego cognitivo',
    icon: '🎮',
    color: '#666',
    evaluates: 'Funciones cognitivas',
    domain: 'General',
  };
}

export function getGameCatalog(): Array<GameInfo & { type: GameType }> {
  return ALL_GAME_TYPES.map((type) => ({ type, ...GAMES[type] }));
}
