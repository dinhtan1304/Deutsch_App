"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { learningGamesApi } from "@/lib/api/learningGames";
import { dashboardKeys } from "./useDashboard";

export function useLearningGame() {
  const client = useQueryClient();
  const start = useMutation({ mutationFn: learningGamesApi.start });
  const resume = useMutation({ mutationFn: learningGamesApi.resume });
  // Explicit retry preserves the same submitted answer after a dropped response.
  const answer = useMutation({
    mutationFn: learningGamesApi.answer,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["learning", "errors"] });
    },
  });
  const finish = useMutation({
    mutationFn: learningGamesApi.finish,
    onSuccess: () => {
      for (const queryKey of [
        dashboardKeys.all,
        ["games", "history"],
        ["users", "stats"],
        ["xp"],
        ["challenges"],
        ["achievements"],
      ]) {
        void client.invalidateQueries({ queryKey });
      }
    },
  });
  return { start, resume, answer, finish };
}
