import { useEffect, useRef, useState } from 'react';
import { useGameConfig } from '../../hooks/useGameConfig';
import { GameCompleteBanner } from './GameCompleteBanner';
import { GameInstructions } from './GameInstructions';
import { GAME_META } from '../../lib/gameConfig';

interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
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

  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  return [
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
      prompt: '¿Qué estación del año corresponde aproximadamente ahora?',
      options: shuffle(seasons),
      answer: season,
    },
    {
      id: 'date',
      prompt: `¿Cuál es la fecha de hoy? (${now.getDate()} de ${month})`,
      options: shuffle([
        `${now.getDate()} de ${month}`,
        `${now.getDate() + 1} de ${month}`,
        `${Math.max(1, now.getDate() - 1)} de ${month}`,
      ]),
      answer: `${now.getDate()} de ${month}`,
    },
  ];
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

  const count = settings.questionsPerSession || 5;

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
    onComplete({
      gameType: 'orientation',
      correct,
      errors,
      totalQuestions: questions.length,
      accuracy: Number((correct / questions.length).toFixed(4)),
    });
  }, [finished, correct, errors, questions.length, onComplete]);

  if (finished) {
    return (
      <div className="orient-game">
        <GameCompleteBanner
          stats={[
            { label: 'Aciertos', value: String(correct) },
            { label: 'Errores', value: String(errors) },
            { label: 'Preguntas', value: String(questions.length) },
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
