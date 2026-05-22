import type { GameType } from './games';

export interface GameMeta {
  title: string;
  subtitle: string;
  evaluates: string;
  instructions: { title: string; steps: string[]; warning?: string };
  stats: [string, string, string];
  accent: string;
}

export const GAME_META: Record<GameType, GameMeta> = {
  memory: {
    title: 'Memoria de Pares',
    subtitle: 'Encuentra todos los pares iguales',
    evaluates: 'Memoria de trabajo, atención y velocidad de reconocimiento',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Toca una tarjeta para voltearla y ver el símbolo.',
        'Toca otra tarjeta: si coinciden, quedan visibles.',
        'Si no coinciden, se ocultan de nuevo. Memoriza las posiciones.',
        'Encuentra todos los pares con el menor número de movimientos.',
      ],
    },
    stats: ['Movimientos', 'Errores', 'Pares'],
    accent: '#667eea',
  },
  stroop: {
    title: 'Test de Stroop',
    subtitle: 'Nombre el color de la tinta, no la palabra',
    evaluates: 'Control inhibitorio, flexibilidad cognitiva y velocidad de procesamiento',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Verás una palabra de color (ej: "ROJO" escrita en tinta azul).',
        'Tu tarea es IGNORAR el significado de la palabra.',
        'Selecciona el botón del COLOR DE LA TINTA en que está escrita.',
        'Responde lo más rápido y preciso que puedas.',
      ],
      warning: 'No elijas lo que dice la palabra — solo el color visual.',
    },
    stats: ['Aciertos', 'Errores', 'Tiempo ms'],
    accent: '#f5576c',
  },
  navigation: {
    title: 'Navegación Espacial',
    subtitle: 'Lleva tu estrella hasta la meta',
    evaluates: 'Orientación espacial, memoria espacial y planificación de rutas',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Tu personaje es la estrella ★. La meta es el banderín ⚑.',
        'Usa las flechas del teclado o los botones para moverte.',
        'Completa 5 niveles: en cada uno la meta cambia de lugar.',
        'Planifica la ruta más corta posible.',
      ],
    },
    stats: ['Nivel', 'Movimientos', 'Errores'],
    accent: '#4facfe',
  },
  whackamole: {
    title: 'Whack-a-Mole',
    subtitle: 'Toca el hámster, ignora la X',
    evaluates: 'Control inhibitorio (Go/No-Go), tiempo de reacción y atención sostenida',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Cuando aparezca el hámster 🐹, tócalo rápido.',
        'Si aparece una X roja, NO la toques (es distractor).',
        'Si no respondes a tiempo, cuenta como error.',
        'Mantén la atención durante toda la ronda.',
      ],
      warning: 'Tocar la X es un error de inhibición (falso positivo).',
    },
    stats: ['Aciertos', 'Errores', 'Tiempo ms'],
    accent: '#fa709a',
  },
};

export function parseGameType(value: string | null): GameType {
  if (value === 'stroop' || value === 'navigation' || value === 'whackamole' || value === 'memory') {
    return value;
  }
  return 'memory';
}
