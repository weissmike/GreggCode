
export enum AppMode {
  LEARN = 'LEARN',
  TRANSLATE = 'TRANSLATE',
  FOLIO = 'FOLIO'
}

export interface TrainingWord {
  word: string;
  hint: string;
  category: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  words: TrainingWord[];
}

export interface RecognitionResult {
  prediction: string;
  confidence: number;
  explanation?: string;
}

export interface FolioGuide {
  id: string;
  title: string;
  description?: string;
  type: 'built-in' | 'user';
  assetUrl?: string;
  createdAt?: string;
}

export interface PrimitiveSequence {
  tokens: string[];
  source: 'keyboard' | 'latex';
}
