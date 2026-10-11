"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, Card, Input } from "@/components/ui";
import {
  IconChevronLeft,
  IconCheck,
  IconX,
  IconRefresh,
  IconTrophy,
  IconClock,
  IconLightbulb,
} from "@/components/ui/Icons";
import { GameResultCard } from "@/components/games/GameUI";
import { ACCENT, GRADIENT, STATUS } from "@/lib/tokens";
import { LEARNING_GAME_ACCENTS } from "@/config/learningGames";
import { getAuthEpoch, useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useLearningGame } from "@/hooks/useLearningGame";
import type {
  LearningGameLevel,
  LearningGameRound,
  LearningGameType,
  LearningGameTopic,
} from "@/lib/api/learningGames";
import { LEARNING_GAME_TOPICS } from "@/lib/api/learningGames";
import { GameArtwork } from "./GameArtwork";

function Countdown({
  onTimeout,
  disabled,
  label,
}: {
  onTimeout: () => void;
  disabled: boolean;
  label: string;
}) {
  const [deadline] = useState(() => Date.now() + 45000);
  const [remaining, setRemaining] = useState(45);
  const expired = useRef(false);
  useEffect(() => {
    const interval = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds && !disabled && !expired.current) {
        expired.current = true;
        onTimeout();
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [deadline, disabled, onTimeout]);
  return (
    <span
      className="inline-flex items-center gap-1 text-body tabular-nums"
      aria-label={`${label}: ${remaining}`}
      style={{
        color: remaining <= 10 ? STATUS.danger : "var(--theme-text-muted)",
      }}
    >
      <IconClock size={16} /> {remaining}s
    </span>
  );
}

export function LearningGame({ gameType }: { gameType: LearningGameType }) {
  const owner = useAuthStore((s) => s.user?.id ?? "guest");
  return (
    <LearningGameContent key={`${owner}:${gameType}`} gameType={gameType} />
  );
}

function LearningGameContent({ gameType }: { gameType: LearningGameType }) {
  const t = useTranslations("games.learning");
  const definitions = useTranslations("games.definitions");
  const router = useRouter();
  const auth = useAuthStore();
  const preferredLevel = useSettingsStore((s) => s.settings.preferredLevel);
  const initialLevel = ["A1", "A2", "B1", "B2"].includes(preferredLevel)
    ? (preferredLevel as LearningGameLevel)
    : "A1";
  const [level, setLevel] = useState<LearningGameLevel>(initialLevel);
  const [topic, setTopic] = useState<LearningGameTopic>("all");
  const [adaptive, setAdaptive] = useState(true);
  const [timed, setTimed] = useState(false);
  const [round, setRound] = useState<LearningGameRound | null>(null);
  const [phase, setPhase] = useState<"setup" | "playing" | "result">("setup");
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [tiles, setTiles] = useState<number[]>([]);
  const [suspect, setSuspect] = useState<number | null>(null);
  const [submittedValue, setSubmittedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [practice, setPractice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  const api = useLearningGame();
  const { playCorrect, playWrong, playGameOver, playClick } = useSoundEffects();
  const accentKey = LEARNING_GAME_ACCENTS[gameType];
  const accent = ACCENT[accentKey];
  const name = definitions(`${gameType}.nameVi`);
  const busy =
    api.start.isPending ||
    api.answer.isPending ||
    api.finish.isPending ||
    api.resume.isPending;
  const ready = auth._hasHydrated && !auth.isLoading;
  const storageKey = `dm:learning-game:${auth.user?.id ?? "guest"}:${gameType}`;
  const question = round?.questions[index];
  const feedback = round?.answers.find((a) => a.questionId === question?.id);
  const answer = question?.tokens
    ? tiles
        .map((i) => question.tokens![i])
        .join(" ")
        .replace(/\s+,/g, ",")
    : input;
  const lockedInput = busy || !!feedback || submittedValue !== null;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (phase !== "playing") return;
    if (feedback) nextRef.current?.focus();
    else inputRef.current?.focus();
  }, [phase, index, feedback]);
  useEffect(() => {
    if (phase !== "playing" || !question?.options || lockedInput) return;
    const choose = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (target instanceof HTMLElement &&
          (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)))
      )
        return;
      const option = question.options?.[Number(event.key) - 1];
      if (/^[1-4]$/.test(event.key) && option) {
        event.preventDefault();
        setInput(option);
        playClick();
      }
    };
    window.addEventListener("keydown", choose);
    return () => window.removeEventListener("keydown", choose);
  }, [phase, question, lockedInput, playClick]);

  const remember = (id: string | null) => {
    try {
      if (id) sessionStorage.setItem(storageKey, id);
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* Playing remains available without storage. */
    }
  };
  const resetAnswer = () => {
    setInput("");
    setTiles([]);
    setSuspect(null);
    setSubmittedValue(null);
    setError(null);
  };
  const valid = (epoch: number) => alive.current && getAuthEpoch() === epoch;

  async function start() {
    if (lock.current || !ready) return;
    lock.current = true;
    setError(null);
    const epoch = getAuthEpoch();
    try {
      const next = await api.start.mutateAsync({
        gameType,
        level,
        topic,
        adaptive: auth.isAuthenticated && adaptive,
        guest: !auth.isAuthenticated,
      });
      if (!valid(epoch)) return;
      remember(next.sessionId);
      setRound(next);
      setLevel(next.questions[0]?.level ?? level);
      setIndex(0);
      resetAnswer();
      setPractice(false);
      setPhase("playing");
      playClick();
    } catch {
      if (valid(epoch)) setError(t("connectionError"));
    } finally {
      lock.current = false;
    }
  }

  async function resume() {
    if (lock.current || !ready) return;
    let id: string | null = null;
    try {
      id = sessionStorage.getItem(storageKey);
    } catch {
      /* Report unavailable saved session. */
    }
    if (!id) {
      setError(t("noSavedRound"));
      return;
    }
    lock.current = true;
    setError(null);
    const epoch = getAuthEpoch();
    try {
      const next = await api.resume.mutateAsync(id);
      if (!valid(epoch)) return;
      const first = next.questions[0];
      if (!first) throw new Error("Saved round has no questions");
      setRound(next);
      setIndex(Math.min(next.answers.length, next.questions.length - 1));
      resetAnswer();
      setPractice(false);
      setLevel(first.level);
      setTopic(next.selection?.topic ?? "all");
      setAdaptive(next.selection?.adaptive ?? true);
      setPhase(next.endedAt ? "result" : "playing");
    } catch {
      if (valid(epoch)) setError(t("resumeError"));
    } finally {
      lock.current = false;
    }
  }

  async function submit(value = answer) {
    if (lock.current || feedback || !question || !round) return;
    const frozenAnswer = submittedValue ?? value;
    lock.current = true;
    setError(null);
    setSubmittedValue(frozenAnswer);
    const epoch = getAuthEpoch();
    try {
      const result = await api.answer.mutateAsync({
        ...(round.sessionId ? { sessionId: round.sessionId } : {}),
        questionId: question.id,
        answer: frozenAnswer,
      });
      if (!valid(epoch)) return;
      setRound({ ...round, answers: [...round.answers, result] });
      if (result.correct) playCorrect();
      else playWrong();
    } catch {
      if (valid(epoch)) setError(t("answerError"));
    } finally {
      lock.current = false;
    }
  }

  async function next() {
    if (lock.current || !round || !feedback) return;
    if (index < round.questions.length - 1) {
      setIndex(index + 1);
      resetAnswer();
      return;
    }
    lock.current = true;
    setError(null);
    const epoch = getAuthEpoch();
    try {
      if (round.sessionId) await api.finish.mutateAsync(round.sessionId);
      if (!valid(epoch)) return;
      if (round.sessionId) remember(null);
      setPhase("result");
      playGameOver();
    } catch {
      if (valid(epoch)) setError(t("finishError"));
    } finally {
      lock.current = false;
    }
  }

  function practiceMistakes() {
    if (!round) return;
    const incorrect = new Set(
      round.answers.filter((a) => !a.correct).map((a) => a.questionId),
    );
    const questions = round.questions.filter((q) => incorrect.has(q.id));
    if (!questions.length) return;
    setRound({ sessionId: null, questions, answers: [] });
    setIndex(0);
    resetAnswer();
    setPractice(true);
    setTimed(false);
    setPhase("playing");
  }

  function addCharacter(character: string) {
    const element = inputRef.current;
    const position = element?.selectionStart ?? input.length;
    const end = element?.selectionEnd ?? position;
    setInput(input.slice(0, position) + character + input.slice(end));
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(position + 1, position + 1);
    });
  }

  const correct = round?.answers.filter((a) => a.correct).length ?? 0;
  let score = 0,
    streak = 0,
    bestStreak = 0;
  for (const item of round?.answers ?? []) {
    streak = item.correct ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
    if (item.correct) score += 10 * Math.min(streak, 4);
  }

  return (
    <div
      className="mx-auto max-w-5xl px-4 py-6 sm:px-6"
      style={{ color: "var(--theme-text-primary)" }}
    >
      <Link
        href="/games"
        className="mb-6 inline-flex items-center gap-2 text-body"
        style={{ color: "var(--theme-text-muted)" }}
      >
        <IconChevronLeft size={16} /> {t("back")}
      </Link>
      {phase === "setup" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card
            variant="bordered"
            className="relative overflow-hidden p-6 sm:p-8"
          >
            <div style={{ color: accent }}>
              <GameArtwork gameType={gameType} />
            </div>
            <p
              className="mt-4 text-caption font-semibold uppercase"
              style={{ color: accent }}
            >
              {t("eyebrow")}
            </p>
            <h1 className="mt-2 text-h1 font-bold">{name}</h1>
            <p
              className="mt-3 text-lead"
              style={{ color: "var(--theme-text-secondary)" }}
            >
              {definitions(`${gameType}.description`)}
            </p>
            <p
              className="mt-6 flex items-start gap-2 text-body"
              style={{ color: "var(--theme-text-muted)" }}
            >
              <IconLightbulb size={18} className="shrink-0" />
              {t(`instructions.${gameType}`)}
            </p>
          </Card>
          <Card variant="bordered" className="space-y-6 p-6 sm:p-8">
            <fieldset>
              <legend className="mb-3 text-body font-semibold">
                {t("level")}
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {(["A1", "A2", "B1", "B2"] as const).map((item) => (
                  <Button
                    type="button"
                    key={item}
                    variant={level === item ? "game" : "secondary"}
                    accent={accentKey}
                    aria-pressed={level === item}
                    disabled={!ready || busy}
                    onClick={() => setLevel(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-body font-semibold">
                {t("topic")}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {LEARNING_GAME_TOPICS.map((item) => (
                  <Button
                    type="button"
                    size="sm"
                    key={item}
                    variant={topic === item ? "game" : "secondary"}
                    accent={accentKey}
                    aria-pressed={topic === item}
                    disabled={!ready || busy}
                    onClick={() => setTopic(item)}
                  >
                    {t(`topics.${item}`)}
                  </Button>
                ))}
              </div>
            </fieldset>
            <div>
              <Button
                type="button"
                role="switch"
                aria-checked={auth.isAuthenticated && adaptive}
                variant={
                  auth.isAuthenticated && adaptive ? "game" : "secondary"
                }
                accent={accentKey}
                fullWidth
                disabled={!ready || busy || !auth.isAuthenticated}
                onClick={() => setAdaptive((value) => !value)}
              >
                {auth.isAuthenticated && adaptive
                  ? t("adaptiveOn")
                  : t("adaptiveOff")}
              </Button>
              <p
                className="mt-2 text-caption"
                style={{ color: "var(--theme-text-muted)" }}
              >
                {auth.isAuthenticated
                  ? t("adaptiveDescription")
                  : t("adaptiveGuest")}
              </p>
            </div>
            <fieldset>
              <legend className="mb-3 text-body font-semibold">
                {t("mode")}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={!timed ? "game" : "secondary"}
                  accent={accentKey}
                  aria-pressed={!timed}
                  disabled={!ready || busy}
                  onClick={() => setTimed(false)}
                >
                  {t("relaxed")}
                </Button>
                <Button
                  variant={timed ? "game" : "secondary"}
                  accent={accentKey}
                  aria-pressed={timed}
                  disabled={!ready || busy}
                  onClick={() => setTimed(true)}
                >
                  {t("timed")}
                </Button>
              </div>
              <p
                className="mt-2 text-caption"
                style={{ color: "var(--theme-text-muted)" }}
              >
                {timed ? t("timedDescription") : t("relaxedDescription")}
              </p>
            </fieldset>
            <p
              className="text-body"
              style={{ color: "var(--theme-text-muted)" }}
            >
              {t("roundDescription")}
            </p>
            {error && (
              <p
                role="alert"
                className="text-body"
                style={{ color: STATUS.danger }}
              >
                {error}
              </p>
            )}
            <Button
              variant="game"
              accent={accentKey}
              size="lg"
              fullWidth
              onClick={() => void start()}
              disabled={!ready || busy}
              isLoading={api.start.isPending}
            >
              {t("start")}
            </Button>
            {auth.isAuthenticated ? (
              <Button
                variant="ghost"
                fullWidth
                onClick={() => void resume()}
                disabled={busy}
                isLoading={api.resume.isPending}
              >
                {t("resume")}
              </Button>
            ) : (
              <p
                className="text-caption"
                style={{ color: "var(--theme-text-muted)" }}
              >
                {t("guest")}{" "}
                <Link
                  href={`/auth/login?returnTo=${encodeURIComponent(`/games/${gameType}`)}`}
                  style={{ color: accent }}
                >
                  {t("login")}
                </Link>
              </p>
            )}
          </Card>
        </div>
      )}

      {phase === "playing" && question && round && (
        <div className="mx-auto max-w-3xl space-y-4">
          <header className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-h2 font-semibold">{name}</h1>
              <p
                className="mt-1 text-caption"
                style={{ color: "var(--theme-text-muted)" }}
              >
                {question.level} ·{" "}
                {t("question", {
                  current: index + 1,
                  total: round.questions.length,
                })}
                {practice ? ` · ${t("mistakePractice")}` : ""}
                {question.topic ? ` · ${t(`topics.${question.topic}`)}` : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className="text-body font-semibold"
                style={{ color: accent }}
              >
                {t("score", { score })}
              </span>
              {timed && !feedback && (
                <Countdown
                  key={question.id}
                  disabled={lockedInput}
                  label={t("timeLeft")}
                  onTimeout={() => void submit("")}
                />
              )}
            </div>
          </header>
          {!practice && round.selection && (
            <Card
              variant="bordered"
              className="space-y-2 p-4"
              aria-label={t("selectionTitle")}
            >
              <p
                className="text-body"
                style={{ color: "var(--theme-text-secondary)" }}
              >
                {t(`selectionReasons.${round.selection.reason}`, {
                  level: round.selection.level,
                  requestedLevel: round.selection.requestedLevel,
                })}
              </p>
              {round.selection.focusSkills.length > 0 && (
                <p className="text-caption" style={{ color: accent }}>
                  {t("focusSkills", {
                    skills: round.selection.focusSkills
                      .map((skill) => t(`skills.${skill}`))
                      .join(", "),
                  })}
                </p>
              )}
            </Card>
          )}
          <div
            role="progressbar"
            aria-label={t("progress")}
            aria-valuemin={0}
            aria-valuemax={round.questions.length}
            aria-valuenow={round.answers.length}
            className="h-2 overflow-hidden rounded-full"
            style={{ background: "var(--theme-bg-secondary)" }}
          >
            <div
              className="h-full transition-all motion-reduce:transition-none"
              style={{
                width: `${(round.answers.length / round.questions.length) * 100}%`,
                background:
                  GRADIENT[accentKey as keyof typeof GRADIENT] ??
                  GRADIENT.brand,
              }}
            />
          </div>
          <Card variant="bordered" className="p-4 sm:p-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!lockedInput && answer.trim()) void submit();
              }}
            >
              <p
                className="mb-4 text-body"
                style={{ color: "var(--theme-text-muted)" }}
              >
                {t(`instructions.${gameType}`)}
              </p>

              {gameType === "dialogue" && (
                <div className="mb-6 space-y-3">
                  <p
                    className="text-caption font-semibold"
                    style={{ color: accent }}
                  >
                    {question.scenario}
                  </p>
                  {round.questions
                    .slice(0, index)
                    .filter((q) => q.scenario === question.scenario)
                    .map((q) => {
                      const previous = round.answers.find(
                        (a) => a.questionId === q.id,
                      );
                      return (
                        <div
                          key={q.id}
                          className="space-y-2 text-body"
                          style={{ color: "var(--theme-text-muted)" }}
                        >
                          <p
                            className="rounded-lg p-3"
                            style={{ background: "var(--theme-bg-secondary)" }}
                          >
                            {q.prompt}
                          </p>
                          <p
                            className="ml-6 rounded-lg border p-3"
                            style={{ borderColor: "var(--theme-border)" }}
                          >
                            {previous?.correctAnswer}
                          </p>
                        </div>
                      );
                    })}
                  <p
                    className="rounded-lg p-4 text-lead font-semibold"
                    lang="de"
                    style={{ background: "var(--theme-bg-secondary)" }}
                  >
                    {question.prompt}
                  </p>
                  <p className="text-body" style={{ color: accent }}>
                    {question.goal}
                  </p>
                </div>
              )}

              {gameType === "word-family" && (
                <div className="mb-6 text-center">
                  <span
                    className="inline-block rounded-lg px-6 py-3 text-h2 font-semibold"
                    lang="de"
                    style={{
                      background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                      color: accent,
                    }}
                  >
                    {question.stem}
                  </span>
                  <div
                    aria-hidden="true"
                    className="mx-auto h-6 w-px"
                    style={{ background: accent }}
                  />
                  <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
                    {(["noun", "verb", "adjective"] as const).map((kind) => (
                      <span
                        key={kind}
                        className="rounded-lg border p-2 text-caption"
                        style={{
                          borderColor: "var(--theme-border)",
                          color: "var(--theme-text-muted)",
                        }}
                      >
                        {t(kind)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {gameType === "grammar-detective" && (
                <div className="mb-6 flex flex-wrap gap-2" lang="de">
                  {question.prompt.split(" ").map((word, i) => (
                    <Button
                      type="button"
                      variant="secondary"
                      key={i}
                      disabled={lockedInput}
                      aria-pressed={suspect === i}
                      onClick={() => setSuspect(suspect === i ? null : i)}
                      style={
                        suspect === i
                          ? { color: STATUS.danger, borderColor: STATUS.danger }
                          : {}
                      }
                    >
                      {word}
                    </Button>
                  ))}
                </div>
              )}

              {gameType !== "sentence-builder" &&
                gameType !== "dialogue" &&
                gameType !== "grammar-detective" && (
                  <p
                    className="mb-6 text-center text-h2 font-semibold"
                    lang="de"
                  >
                    {question.prompt}
                    {gameType === "plural" ? " → …" : ""}
                  </p>
                )}

              {question.tokens && (
                <>
                  <div
                    aria-label={t("yourSentence")}
                    className="mb-4 flex min-h-24 flex-wrap content-start gap-2 rounded-lg border p-4"
                    style={{
                      borderColor: accent,
                      background: `color-mix(in srgb, ${accent} 6%, transparent)`,
                    }}
                  >
                    {tiles.length === 0 && (
                      <span
                        className="text-body"
                        style={{ color: "var(--theme-text-muted)" }}
                      >
                        {t("tilePlaceholder")}
                      </span>
                    )}
                    {tiles.map((tile, position) => (
                      <Button
                        type="button"
                        variant="game"
                        accent={accentKey}
                        key={tile}
                        disabled={lockedInput}
                        aria-label={t("removeTile", {
                          word: question.tokens![tile]!,
                        })}
                        onClick={() =>
                          setTiles(tiles.filter((_, i) => i !== position))
                        }
                      >
                        {question.tokens![tile]}
                      </Button>
                    ))}
                  </div>
                  <div
                    aria-label={t("wordTiles")}
                    className="mb-4 flex flex-wrap justify-center gap-2"
                    lang="de"
                  >
                    {question.tokens.map((word, i) => (
                      <Button
                        type="button"
                        variant="secondary"
                        key={i}
                        disabled={lockedInput || tiles.includes(i)}
                        aria-label={t("addTile", { word })}
                        onClick={() => setTiles([...tiles, i])}
                      >
                        {word}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={lockedInput || !tiles.length}
                    onClick={() => setTiles([])}
                    leftIcon={<IconRefresh size={14} />}
                  >
                    {t("clear")}
                  </Button>
                </>
              )}

              {question.options && (
                <fieldset
                  className="grid gap-3 sm:grid-cols-2"
                  aria-label={t("options")}
                >
                  {question.options.map((option, i) => (
                    <Button
                      type="button"
                      key={option}
                      variant={input === option ? "game" : "secondary"}
                      accent={accentKey}
                      className="min-h-12 justify-start text-left"
                      disabled={lockedInput}
                      aria-pressed={input === option}
                      onClick={() => {
                        setInput(option);
                        playClick();
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="text-caption opacity-60"
                      >
                        {i + 1}
                      </span>
                      <span lang="de">{option}</span>
                    </Button>
                  ))}
                </fieldset>
              )}

              {!question.tokens && !question.options && (
                <div className="space-y-3">
                  <Input
                    ref={inputRef}
                    label={
                      gameType === "plural"
                        ? t("pluralAnswer")
                        : t("correctedSentence")
                    }
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={lockedInput}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    lang="de"
                    maxLength={500}
                    placeholder={gameType === "plural" ? "die …" : undefined}
                  />
                  <div
                    className="flex flex-wrap gap-2"
                    aria-label={t("germanLetters")}
                  >
                    {["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"].map((letter) => (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        key={letter}
                        disabled={lockedInput}
                        onClick={() => addCharacter(letter)}
                      >
                        {letter}
                      </Button>
                    ))}
                  </div>
                  <p
                    className="text-caption"
                    style={{ color: "var(--theme-text-muted)" }}
                  >
                    {t("caseSensitive")}
                  </p>
                </div>
              )}

              {!feedback && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    variant="game"
                    accent={accentKey}
                    disabled={
                      lockedInput ||
                      !answer.trim() ||
                      (!!question.tokens &&
                        tiles.length !== question.tokens.length)
                    }
                    isLoading={api.answer.isPending}
                  >
                    {t("check")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={lockedInput}
                    onClick={() => void submit("")}
                  >
                    {t("skip")}
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {feedback && (
            <Card
              variant="bordered"
              className="space-y-3 p-4 sm:p-6"
              role="status"
              style={{
                borderColor: feedback.correct ? STATUS.success : STATUS.warning,
              }}
            >
              <h2
                className="flex items-center gap-2 text-h3 font-semibold"
                style={{
                  color: feedback.correct ? STATUS.success : STATUS.warning,
                }}
              >
                {feedback.correct ? (
                  <IconCheck size={20} />
                ) : (
                  <IconLightbulb size={20} />
                )}
                {feedback.correct ? t("correct") : t("learnFromMistake")}
              </h2>
              <p className="text-lead font-semibold" lang="de">
                {feedback.correctAnswer}
              </p>
              <p
                className="text-body"
                style={{ color: "var(--theme-text-secondary)" }}
              >
                {feedback.explanation}
              </p>
              {feedback.acceptedAnswers.length > 1 && (
                <details className="text-body">
                  <summary className="cursor-pointer" style={{ color: accent }}>
                    {t("otherAnswers")}
                  </summary>
                  <ul className="mt-2 space-y-2" lang="de">
                    {feedback.acceptedAnswers.slice(1).map((accepted) => (
                      <li key={accepted}>{accepted}</li>
                    ))}
                  </ul>
                </details>
              )}
              <Button
                ref={nextRef}
                variant="game"
                accent={accentKey}
                onClick={() => void next()}
                disabled={busy}
                isLoading={api.finish.isPending}
              >
                {index === round.questions.length - 1
                  ? t("results")
                  : t("next")}
              </Button>
            </Card>
          )}
          {error && (
            <Card variant="bordered" className="space-y-3 p-4">
              <p
                role="alert"
                className="text-body"
                style={{ color: STATUS.danger }}
              >
                {error}
              </p>
              <div className="flex flex-wrap gap-2">
                {!feedback && (
                  <Button
                    variant="game"
                    accent={accentKey}
                    disabled={busy}
                    onClick={() => void submit()}
                  >
                    {t("retry")}
                  </Button>
                )}
                {round.sessionId && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void resume()}
                  >
                    {t("reloadSaved")}
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {phase === "result" && round && (
        <div className="grid gap-6 md:grid-cols-2">
          <GameResultCard
            bare
            accuracy={Math.round((correct / round.questions.length) * 100)}
            correct={correct}
            total={round.questions.length}
            onRestart={() => {
              setPhase("setup");
              setRound(null);
              resetAnswer();
            }}
            onExit={() => router.push("/games")}
            stats={[
              {
                label: t("points"),
                value: score,
                color: accent,
                icon: IconTrophy,
              },
              { label: t("bestStreak"), value: bestStreak, color: ACCENT.xp },
            ]}
          >
            <p
              className="mt-4 text-caption"
              style={{ color: "var(--theme-text-muted)" }}
            >
              {round.sessionId
                ? t("savedResult")
                : practice
                  ? t("practiceResult")
                  : t("guestResult")}
            </p>
          </GameResultCard>
          <Card variant="bordered" className="space-y-4 p-6">
            <h2 className="text-h2 font-semibold">{t("reviewTitle")}</h2>
            <div className="space-y-3">
              {[...new Set(round.answers.map((a) => a.skill))].map((skill) => {
                const items = round.answers.filter((a) => a.skill === skill);
                return (
                  <div
                    key={skill}
                    className="flex items-center justify-between gap-3 text-body"
                  >
                    <span>{t(`skills.${skill}`)}</span>
                    <span
                      className="shrink-0 font-semibold"
                      style={{
                        color: items.every((a) => a.correct)
                          ? STATUS.success
                          : STATUS.warning,
                      }}
                    >
                      {items.filter((a) => a.correct).length}/{items.length}
                    </span>
                  </div>
                );
              })}
            </div>
            {correct < round.questions.length && (
              <Button
                variant="game"
                accent={accentKey}
                fullWidth
                onClick={practiceMistakes}
              >
                {t("practiceMistakes")}
              </Button>
            )}
            {auth.isAuthenticated && (
              <Link
                href="/error-notebook"
                className="inline-flex text-body font-semibold"
                style={{ color: accent }}
              >
                {t("notebook")} →
              </Link>
            )}
            <details className="text-body">
              <summary
                className="cursor-pointer"
                style={{ color: "var(--theme-text-muted)" }}
              >
                {t("allAnswers")}
              </summary>
              <ol className="mt-4 space-y-4">
                {round.answers.map((item, i) => (
                  <li
                    key={item.questionId}
                    className="border-t pt-3"
                    style={{ borderColor: "var(--theme-border)" }}
                  >
                    <p className="flex gap-2 font-semibold" lang="de">
                      {item.correct ? (
                        <IconCheck
                          size={16}
                          style={{ color: STATUS.success }}
                        />
                      ) : (
                        <IconX size={16} style={{ color: STATUS.warning }} />
                      )}{" "}
                      {i + 1}. {item.correctAnswer}
                    </p>
                    {!item.correct && (
                      <p
                        className="mt-1 text-caption"
                        style={{ color: "var(--theme-text-muted)" }}
                      >
                        {t("yourAnswer")}:{" "}
                        <span lang="de">
                          {item.selectedAnswer || t("skipped")}
                        </span>
                      </p>
                    )}
                    <p
                      className="mt-2 text-caption"
                      style={{ color: "var(--theme-text-secondary)" }}
                    >
                      {item.explanation}
                    </p>
                  </li>
                ))}
              </ol>
            </details>
          </Card>
        </div>
      )}
    </div>
  );
}
