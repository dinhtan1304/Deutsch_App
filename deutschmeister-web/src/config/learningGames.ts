import type { LearningGameType } from "@/lib/api/learningGames";
import type { AccentKey } from "@/lib/tokens";

export const LEARNING_GAME_ACCENTS: Record<LearningGameType, AccentKey> = {
  "sentence-builder": "srs",
  collocations: "cyan",
  "grammar-detective": "writing",
  plural: "vocab",
  "word-family": "reading",
  dialogue: "speaking",
};
