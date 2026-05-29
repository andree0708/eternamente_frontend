import { useEffect, useRef, useState } from 'react';
import { useGameConfig } from '../../hooks/useGameConfig';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';
import { calcScore } from '../../lib/scoring';

interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(): Question[] {
  const now = new Date();
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const seasons = ['invierno', 'primavera', 'verano', 'otoño'];
  const month = months[now.getMonth()];
  const dayName = days[now.getDay()];
  const year = String(now.getFullYear());
  const season = seasons[Math.floor(now.getMonth() / 3)];
  const dayNum = now.getDate();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'mañana' : hour < 18 ? 'tarde' : 'noche';
  const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const yesterday = days[(now.getDay() + 6) % 7];
  const tomorrow = days[(now.getDay() + 1) % 7];
  const monthNum = now.getMonth() + 1;
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const all: Question[] = [
    {
      id: 'day',
      prompt: '¿Qué día de la semana es hoy?',
      options: shuffle(days),
      answer: dayName,
    },
    {
      id: 'month',
      prompt: '¿En qué mes estamos?',
      options: shuffle(months.slice(0, 12)),
      answer: month,
    },
    {
      id: 'year',
      prompt: '¿En qué año estamos?',
      options: shuffle([String(now.getFullYear() - 1), year, String(now.getFullYear() + 1)]),
      answer: year,
    },
    {
      id: 'season',
      prompt: '¿Qué estación del año es ahora?',
      options: shuffle(seasons),
      answer: season,
    },
    {
      id: 'date',
      prompt: '¿Cuál es la fecha completa de hoy? (ej: lunes, 29 de mayo de 2026)',
      options: shuffle([
        `${dayName}, ${dayNum} de ${month} de ${year}`,
        `${dayName}, ${dayNum + 1} de ${month} de ${year}`,
        `${days[(now.getDay() + 1) % 7]}, ${dayNum} de ${month} de ${year}`,
        `${dayName}, ${Math.max(1, dayNum - 1)} de ${month} de ${year}`,
      ]),
      answer: `${dayName}, ${dayNum} de ${month} de ${year}`,
    },
    {
      id: 'daynum',
      prompt: '¿Qué número de día del mes es hoy?',
      options: shuffle([
        String(dayNum),
        String(Math.min(monthDays, dayNum + 5)),
        String(Math.max(1, dayNum - 3)),
      ]),
      answer: String(dayNum),
    },
    {
      id: 'daysleft',
      prompt: '¿Cuántos días tiene este mes?',
      options: shuffle([String(monthDays), String(monthDays - 1), String(monthDays + 1)]),
      answer: String(monthDays),
    },
    {
      id: 'timeofday',
      prompt: 'En este momento, ¿es mañana, tarde o noche?',
      options: shuffle(['mañana', 'tarde', 'noche']),
      answer: timeOfDay,
    },
    {
      id: 'yesterday',
      prompt: '¿Ayer fue qué día de la semana?',
      options: shuffle(days),
      answer: yesterday,
    },
    {
      id: 'tomorrow',
      prompt: '¿Mañana será qué día de la semana?',
      options: shuffle(days),
      answer: tomorrow,
    },
    {
      id: 'monthnum',
      prompt: '¿Qué número de mes es? (ej: enero=1, febrero=2)',
      options: shuffle([
        String(monthNum),
        String(Math.max(1, monthNum - 1)),
        String(Math.min(12, monthNum + 1)),
      ]),
      answer: String(monthNum),
    },
    {
      id: 'quarter',
      prompt: '¿En qué trimestre del año estamos?',
      options: shuffle(['1.er trimestre', '2.º trimestre', '3.er trimestre', '4.º trimestre']),
      answer: `${quarter}.${quarter === 1 ? 'er' : 'º'} trimestre`,
    },
    {
      id: 'weekend',
      prompt: '¿Hoy es fin de semana o día entre semana?',
      options: shuffle(['Fin de semana', 'Entre semana']),
      answer: isWeekend ? 'Fin de semana' : 'Entre semana',
    },
    {
      id: 'hour',
      prompt: 'Aproximadamente, ¿qué hora es ahora?',
      options: shuffle([
        `${hour}:00`,
        `${Math.max(0, hour - 1)}:00`,
        `${Math.min(23, hour + 1)}:00`,
      ]),
      answer: `${hour}:00`,
    },
  ];

  return shuffle(all).slice(0, 7);
}

interface Props {
  onComplete: (metrics: Record<string, unknown>) => void;
  onStatsChange?: (values: [number, number, number]) => void;
}

export function OrientationGame({ onComplete, onStatsChange }: Props) {
  const meta = GAME_META.orientation;
  const { settings } = useGameConfig('orientation');
  const [started, setStarted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<'ok' | 'bad' | null>(null);
  const savedRef = useRef(false);

  const count = settings.questionsPerSession || 7;

  useEffect(() => {
    if (!started) return;
    setQuestions(buildQuestions().slice(0, count));
    setIndex(0);
    setCorrect(0);
    setErrors(0);
    setFinished(false);
    setLastAnswer(null);
    savedRef.current = false;
  }, [started, count]);

  const q = questions[index];

  useEffect(() => {
    onStatsChange?.([correct, errors, questions.length || count]);
  }, [correct, errors, questions.length, count, onStatsChange]);

  const answer = (option: string) => {
    if (finished || !q) return;
    const ok = option === q.answer;
    setLastAnswer(ok ? 'ok' : 'bad');
    if (ok) {
      setCorrect((c) => c + 1);
    } else {
      setErrors((e) => e + 1);
    }
    if (index + 1 >= questions.length) {
      setTimeout(() => setFinished(true), 600);
    } else {
      setTimeout(() => {
        setIndex((i) => i + 1);
        setLastAnswer(null);
      }, 600);
    }
  };

  useEffect(() => {
    if (!finished || savedRef.current || questions.length === 0) return;
    savedRef.current = true;
    const score = calcScore('orientation', { correct, errors });
    onComplete({
      gameType: 'orientation',
      correct,
      errors,
      totalQuestions: questions.length,
      accuracy: Number((correct / questions.length).toFixed(4)),
      score,
    });
  }, [finished, correct, errors, questions.length, onComplete]);

  if (finished) {
    const score = calcScore('orientation', { correct, errors });
    return (
      <div className="orient-game">
        <GameCompleteBanner
          stats={[
            { label: 'Aciertos', value: String(correct) },
            { label: 'Errores', value: String(errors) },
            { label: 'Preguntas', value: String(questions.length) },
            { label: 'Puntuación', value: String(score) },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="orient-game">
      <GameInstructions
        title={meta.instructions.title}
        steps={meta.instructions.steps}
        accent={meta.accent}
        started={started}
        onStart={() => setStarted(true)}
        helpOpen={helpOpen}
        onToggleHelp={() => setHelpOpen((o) => !o)}
      />
      {started && questions.length === 0 && (
        <p className="game-loading" aria-live="polite">Preparando preguntas…</p>
      )}
      {started && q && (
        <>
          <p className="orient-game__progress">
            Pregunta {index + 1} de {questions.length}
          </p>
          {lastAnswer && (
            <p className={`game-feedback game-feedback--${lastAnswer}`} role="status">
              {lastAnswer === 'ok' ? '✓ Correcto' : '✗ Incorrecto'}
            </p>
          )}
          <h2 className="orient-game__prompt">{q.prompt}</h2>
          <div className="orient-game__options">
            {q.options.map((opt) => (
              <button key={opt} type="button" className="orient-game__opt" onClick={() => answer(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
