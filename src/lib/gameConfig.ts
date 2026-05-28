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
    title: 'Memorama de Pares',
    subtitle: 'Encuentra todos los pares iguales',
    evaluates: 'Memoria visual episódica y memoria de trabajo',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Toca una tarjeta para ver el símbolo.',
        'Toca otra: si coinciden, quedan visibles.',
        'Memoriza las posiciones cuando no coincidan.',
        'Encuentra todos los pares con pocos movimientos.',
      ],
    },
    stats: ['Movimientos', 'Errores', 'Pares'],
    accent: '#667eea',
  },
  stroop: {
    title: 'Stroop de Colores',
    subtitle: 'Elige el color de la tinta, no la palabra',
    evaluates: 'Control inhibitorio e interferencia cognitiva',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Verás una palabra de color (ej: ROJO en tinta azul).',
        'Ignora el significado de la palabra.',
        'Pulsa el botón del color de la tinta.',
        'Responde con calma y precisión.',
      ],
      warning: 'No elijas lo que dice la palabra — solo el color visual.',
    },
    stats: ['Aciertos', 'Errores', 'Tiempo ms'],
    accent: '#f5576c',
  },
  navigation: {
    title: 'Conecta los Puntos',
    subtitle: 'Lleva la estrella ★ hasta la meta ⚑',
    evaluates: 'Planificación y velocidad (inspirado en Trail Making)',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Tu personaje es la estrella ★. La meta es el banderín ⚑.',
        'Usa las flechas grandes o el teclado.',
        'Completa todos los niveles.',
        'Busca el camino más corto.',
      ],
    },
    stats: ['Nivel', 'Movimientos', 'Errores'],
    accent: '#4facfe',
  },
  whackamole: {
    title: 'Flash de Colores',
    subtitle: 'Toca el círculo verde, ignora la X roja',
    evaluates: 'Atención sostenida y respuesta Go/No-Go',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Cuando aparezca el objetivo verde, tócalo rápido.',
        'Si aparece una X roja, no la toques.',
        'Si no respondes a tiempo, cuenta como error.',
        'Mantén la atención durante toda la ronda.',
      ],
      warning: 'Tocar la X es un error de inhibición.',
    },
    stats: ['Aciertos', 'Errores', 'Tiempo ms'],
    accent: '#fa709a',
  },
  digitspan: {
    title: 'Secuencia de Números',
    subtitle: 'Repite los números en el mismo orden',
    evaluates: 'Memoria de trabajo verbal (span de dígitos)',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Observa la secuencia de números que aparece.',
        'Cuando termine, escríbela en el mismo orden.',
        'Cada nivel añade un dígito más.',
        'Puedes usar el teclado numérico en pantalla.',
      ],
    },
    stats: ['Nivel', 'Aciertos', 'Errores'],
    accent: '#5c6bc0',
  },
  corsi: {
    title: 'Reproduce el Patrón',
    subtitle: 'Memoriza y repite la secuencia de casillas',
    evaluates: 'Memoria visoespacial (tipo Corsi)',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Las casillas se iluminarán una tras otra.',
        'Memoriza el orden.',
        'Toca las mismas casillas en el mismo orden.',
        'La secuencia se alarga en cada nivel.',
      ],
    },
    stats: ['Nivel', 'Aciertos', 'Errores'],
    accent: '#26a69a',
  },
  orientation: {
    title: 'Orientación Temporal',
    subtitle: 'Responde sobre la fecha y el tiempo actual',
    evaluates: 'Orientación temporal (día, mes, año, estación)',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Lee cada pregunta con calma.',
        'Elige la respuesta correcta entre las opciones grandes.',
        'Usa la fecha real de hoy como referencia.',
        'No hay límite estricto de tiempo.',
      ],
    },
    stats: ['Aciertos', 'Errores', 'Preguntas'],
    accent: '#8d6e63',
  },
  arithmetic: {
    title: 'Cálculo Mental',
    subtitle: 'Resuelve sumas y restas simples',
    evaluates: 'Velocidad de procesamiento y cálculo aritmético',
    instructions: {
      title: '¿Cómo se juega?',
      steps: [
        'Aparecerá una operación (suma o resta).',
        'Elige la respuesta correcta antes de que se acabe el tiempo.',
        'Las operaciones usan números pequeños.',
        'Intenta ser rápido y exacto.',
      ],
    },
    stats: ['Aciertos', 'Errores', 'Tiempo ms'],
    accent: '#ff8f00',
  },
};

export function parseGameType(value: string | null): GameType {
  const valid: GameType[] = [
    'memory', 'stroop', 'navigation', 'whackamole',
    'digitspan', 'corsi', 'orientation', 'arithmetic',
  ];
  if (value && valid.includes(value as GameType)) return value as GameType;
  return 'memory';
}
