import { BRIEF_FORM_TEMPLATES } from '../constants';
import { RecognitionResult } from '../types';

const MAX_DISTANCE_FLOOR = 1;

const levenshtein = (a: string[], b: string[]): number => {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[rows - 1][cols - 1];
};

const normalizeTokens = (tokens: string[]) => tokens.filter((token) => token.trim() !== '');

export const recognizeFromPrimitives = (tokens: string[]): RecognitionResult => {
  const normalized = normalizeTokens(tokens);
  if (!normalized.length) {
    return {
      prediction: 'UNREADABLE',
      confidence: 0,
      explanation: 'No structured input provided.'
    };
  }

  let bestMatch = 'UNREADABLE';
  let bestScore = 0;

  BRIEF_FORM_TEMPLATES.forEach((template) => {
    const distance = levenshtein(normalized, template.tokens);
    const maxLen = Math.max(MAX_DISTANCE_FLOOR, normalized.length, template.tokens.length);
    const score = 1 - distance / maxLen;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = template.word;
    }
  });

  if (bestScore < 0.6) {
    return {
      prediction: 'UNREADABLE',
      confidence: bestScore,
      explanation: 'Local template match is too weak for a confident decode.'
    };
  }

  return {
    prediction: bestMatch,
    confidence: bestScore,
    explanation: 'Matched against local brief form templates.'
  };
};

export const recognizeFromStrokes = (points: Array<{ x: number; y: number }>): RecognitionResult => {
  if (points.length < 5) {
    return {
      prediction: 'UNREADABLE',
      confidence: 0,
      explanation: 'Not enough stroke data for local analysis.'
    };
  }

  return {
    prediction: 'UNREADABLE',
    confidence: 0.2,
    explanation: 'Freehand local recognition is not yet reliable; use AI fallback.'
  };
};
