
export enum AppMode {
  LEARN = 'LEARN',
  TRANSLATE = 'TRANSLATE'
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
