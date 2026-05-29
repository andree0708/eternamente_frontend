export function calcScore(gameType: string, metrics: Record<string, unknown>): number {
  switch (gameType) {
    case 'memory': {
      const pairs = (metrics.matchedPairs as number) || 0;
      const mism = (metrics.mismatches as number) || 0;
      const diff = metrics.difficulty as string;
      const mult = diff === 'HARD' ? 2 : diff === 'MEDIUM' ? 1.5 : 1;
      return Math.max(0, Math.round((pairs * 100 - mism * 15) * mult));
    }
    case 'whackamole': {
      const hits = (metrics.hits as number) || (metrics.score as number) || 0;
      const miss = (metrics.errors as number) || (metrics.misses as number) || 0;
      return Math.max(0, Math.round(hits * 20 - miss * 10));
    }
    case 'stroop': {
      const corr = (metrics.correct as number) || (metrics.correctAnswers as number) || 0;
      const err = (metrics.errors as number) || 0;
      return Math.max(0, Math.round(corr * 40 - err * 15));
    }
    case 'digitspan': {
      const corr = (metrics.correct as number) || (metrics.correctCount as number) || 0;
      const err = (metrics.errors as number) || 0;
      return Math.max(0, Math.round(corr * 80 - err * 30));
    }
    case 'orientation': {
      const corr = (metrics.correct as number) || 0;
      const err = (metrics.errors as number) || 0;
      return Math.max(0, Math.round(corr * 100 - err * 25));
    }
    case 'arithmetic': {
      const corr = (metrics.correct as number) || 0;
      const err = (metrics.errors as number) || 0;
      return Math.max(0, Math.round(corr * 50 - err * 15));
    }
    case 'navigation': {
      const corr = (metrics.correct as number) || 0;
      const err = (metrics.errors as number) || 0;
      return Math.max(0, Math.round(corr * 60 - err * 20));
    }
    case 'corsi': {
      const corr = (metrics.correct as number) || 0;
      const err = (metrics.errors as number) || 0;
      return Math.max(0, Math.round(corr * 80 - err * 30));
    }
    default:
      return 0;
  }
}
