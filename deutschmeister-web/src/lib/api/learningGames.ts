import { apiGet, apiPost } from "./client";
import type { GameSession } from "@/types";

export const LEARNING_GAME_TYPES = [
  "sentence-builder",
  "collocations",
  "grammar-detective",
  "plural",
  "word-family",
  "dialogue",
] as const;
export type LearningGameType = (typeof LEARNING_GAME_TYPES)[number];
export type LearningGameLevel = "A1" | "A2" | "B1" | "B2";
export const LEARNING_GAME_TOPICS = [
  "all",
  "everyday",
  "shopping",
  "health",
  "housing",
  "training",
  "work",
] as const;
export type LearningGameTopic = (typeof LEARNING_GAME_TOPICS)[number];
export type LearningGameSkill =
  | "verb2"
  | "question"
  | "bracket"
  | "subordinate"
  | "perfect"
  | "agreement"
  | "accusative"
  | "dative"
  | "location"
  | "conditional"
  | "passive"
  | "pastSequence"
  | "genitive"
  | "collocation"
  | "preposition"
  | "plural"
  | "foreignPlural"
  | "family"
  | "suffix"
  | "polite"
  | "dialogue";
export interface LearningGameQuestion {
  id: string;
  gameType: LearningGameType;
  level: LearningGameLevel;
  prompt: string;
  skill: LearningGameSkill;
  topic?: Exclude<LearningGameTopic, "all">;
  tokens?: string[];
  options?: string[];
  stem?: string;
  scenario?: string;
  turn?: number;
  goal?: string;
}
export interface LearningGameFeedback {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
  skill: LearningGameSkill;
}
export interface LearningGameRound {
  sessionId: string | null;
  questions: LearningGameQuestion[];
  answers: LearningGameFeedback[];
  endedAt?: string | null;
  selection?: {
    requestedLevel: LearningGameLevel;
    level: LearningGameLevel;
    topic: LearningGameTopic;
    adaptive: boolean;
    reason: "manual" | "starting" | "steady" | "stepUp" | "stepDown";
    focusSkills: LearningGameSkill[];
  };
}
export const learningGamesApi = {
  start: ({
    guest,
    ...data
  }: {
    guest: boolean;
    gameType: LearningGameType;
    level: LearningGameLevel;
    topic?: LearningGameTopic;
    adaptive?: boolean;
  }) =>
    apiPost<LearningGameRound>(
      `/games/learning/${guest ? "practice/" : ""}start`,
      data,
    ),
  answer: (data: { sessionId?: string; questionId: string; answer: string }) =>
    apiPost<LearningGameFeedback>(
      `/games/learning/${data.sessionId ? "" : "practice/"}answer`,
      data,
    ),
  resume: (id: string) =>
    apiGet<LearningGameRound>(`/games/learning/${encodeURIComponent(id)}`),
  finish: (id: string) =>
    apiPost<GameSession>(`/games/learning/${encodeURIComponent(id)}/finish`),
};
