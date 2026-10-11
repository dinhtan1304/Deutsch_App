import { test, expect, type Page } from "@playwright/test";
import type {
  LearningGameQuestion,
  LearningGameFeedback,
  LearningGameType,
  LearningGameLevel,
  LearningGameTopic,
  LearningGameRound,
} from "../src/lib/api/learningGames";
import { APP_RELEASE } from "../src/config/release";

const names: Record<LearningGameType, string> = {
  "sentence-builder": "Sentence Builder",
  collocations: "Word Connections",
  "grammar-detective": "Grammar Detective",
  plural: "Plural Challenge",
  "word-family": "Word Families",
  dialogue: "Dialogue Quest",
};
function fixture(type: LearningGameType) {
  const base = {
    gameType: type,
    level: "A1" as const,
    skill: "agreement" as const,
  };
  const questions: LearningGameQuestion[] =
    type === "sentence-builder"
      ? [
          {
            ...base,
            id: `${type}:1`,
            prompt: "",
            tokens: ["Deutsch", "lerne", "Ich"],
          },
          {
            ...base,
            id: `${type}:2`,
            prompt: "",
            tokens: ["Wir", "wohnen", "hier"],
          },
        ]
      : type === "plural"
        ? [
            { ...base, id: `${type}:1`, prompt: "das Buch" },
            { ...base, id: `${type}:2`, prompt: "der Tisch" },
          ]
        : type === "grammar-detective"
          ? [
              { ...base, id: `${type}:1`, prompt: "Ich haben einen Hund." },
              { ...base, id: `${type}:2`, prompt: "Du ist sehr nett." },
            ]
          : type === "dialogue"
            ? [
                {
                  ...base,
                  id: `${type}:1`,
                  prompt: "Was möchten Sie trinken?",
                  scenario: "Im Café",
                  turn: 0,
                  goal: "Order a coffee.",
                  options: [
                    "wrong-answer",
                    "Einen Kaffee, bitte.",
                    "Wasser",
                    "Tee",
                  ],
                },
                {
                  ...base,
                  id: `${type}:2`,
                  prompt: "Mit Milch oder ohne Milch?",
                  scenario: "Im Café",
                  turn: 1,
                  goal: "Ask for milk.",
                  options: [
                    "wrong-answer",
                    "Mit Milch, bitte.",
                    "Wasser",
                    "Tee",
                  ],
                },
              ]
            : type === "word-family"
              ? [
                  {
                    ...base,
                    id: `${type}:1`,
                    prompt: "Ich suche eine neue ___.",
                    stem: "arbeiten",
                    options: ["wrong-answer", "Arbeit", "arbeite", "arbeitet"],
                  },
                  {
                    ...base,
                    id: `${type}:2`,
                    prompt: "Unsere ___ ist klein.",
                    stem: "wohnen",
                    options: ["wrong-answer", "Wohnung", "wohnen", "wohnt"],
                  },
                ]
              : [
                  {
                    ...base,
                    id: `${type}:1`,
                    prompt: "Ich ___ meine Hausaufgaben.",
                    options: ["wrong-answer", "mache", "nehme", "fahre"],
                  },
                  {
                    ...base,
                    id: `${type}:2`,
                    prompt: "Wir fahren ___ dem Bus.",
                    options: ["wrong-answer", "mit", "bei", "von"],
                  },
                ];
  const answers =
    type === "sentence-builder"
      ? ["Ich lerne Deutsch", "Wir wohnen hier"]
      : type === "plural"
        ? ["die Bücher", "die Tische"]
        : type === "grammar-detective"
          ? ["Ich habe einen Hund.", "Du bist sehr nett."]
          : questions.map((q) => q.options![1]);
  return { questions, answers };
}

async function mockGames(
  page: Page,
  type: LearningGameType,
  options: {
    authenticated?: boolean;
    dropAnswer?: boolean;
    dropFinish?: boolean;
    adaptiveLevel?: LearningGameLevel;
  } = {},
) {
  const content = fixture(type);
  const saved: LearningGameFeedback[] = [];
  const submitted: string[] = [];
  const starts: {
    gameType: LearningGameType;
    level: LearningGameLevel;
    topic: LearningGameTopic;
    adaptive: boolean;
  }[] = [];
  let selection: LearningGameRound["selection"];
  let droppedAnswer = false,
    droppedFinish = false,
    completions = 0,
    finished = false;
  await page.addInitScript(
    ({ release, authenticated }) => {
      localStorage.setItem(`dm:release-seen:${release}`, "seen");
      if (authenticated) localStorage.setItem("dm_session_hint", "1");
    },
    { release: APP_RELEASE.id, authenticated: options.authenticated ?? false },
  );
  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/auth/refresh") && options.authenticated)
      return route.fulfill({ json: { accessToken: "browser-test-token" } });
    if (pathname.endsWith("/auth/bootstrap") && options.authenticated)
      return route.fulfill({
        json: {
          user: {
            id: "learner",
            email: "learner@example.test",
            name: "Learner",
            avatar: null,
            role: "user",
            emailVerified: true,
            onboardingCompleted: true,
            createdAt: "2025-01-01T00:00:00Z",
          },
          settings: {},
          subscription: { plan: "free", status: "active", expiresAt: null },
          unreadCount: { count: 0 },
          xp: {
            xp: 0,
            level: 1,
            name: "Starter",
            nameVi: "Starter",
            progress: 0,
          },
          streak: 0,
        },
      });
    if (
      pathname.endsWith("/games/learning/start") ||
      pathname.endsWith("/games/learning/practice/start")
    ) {
      const data = route.request().postDataJSON();
      starts.push(data);
      const actualLevel =
        data.adaptive && options.authenticated && options.adaptiveLevel
          ? options.adaptiveLevel
          : data.level;
      selection = options.adaptiveLevel
        ? {
            requestedLevel: data.level,
            level: actualLevel,
            topic: data.topic,
            adaptive: data.adaptive,
            reason: data.adaptive
              ? actualLevel !== data.level
                ? "stepUp"
                : "steady"
              : "manual",
            focusSkills: [],
          }
        : undefined;
      content.questions.forEach((q) => {
        q.level = actualLevel;
        if (data.topic && data.topic !== "all") q.topic = data.topic;
      });
      saved.length = 0;
      finished = false;
      return route.fulfill({
        json: {
          sessionId: options.authenticated ? "browser-round" : null,
          questions: content.questions,
          answers: [],
          selection,
        },
      });
    }
    if (
      pathname.endsWith("/games/learning/answer") ||
      pathname.endsWith("/games/learning/practice/answer")
    ) {
      const data = route.request().postDataJSON();
      submitted.push(data.answer);
      const index = content.questions.findIndex(
        (q) => q.id === data.questionId,
      );
      const feedback = saved.find(
        (answer) =>
          answer.questionId === data.questionId &&
          answer.selectedAnswer === data.answer,
      ) ?? {
        questionId: data.questionId,
        selectedAnswer: data.answer,
        correct: data.answer.trim() === content.answers[index],
        correctAnswer: content.answers[index]!,
        acceptedAnswers: [content.answers[index]!],
        explanation: "Use the correct German form in this context.",
        skill: content.questions[index]!.skill,
      };
      if (!saved.some((a) => a.questionId === data.questionId))
        saved.push(feedback);
      if (options.dropAnswer && !droppedAnswer) {
        droppedAnswer = true;
        return route.fulfill({
          status: 503,
          json: { message: "Dropped response after commit" },
        });
      }
      return route.fulfill({ json: feedback });
    }
    if (
      pathname.endsWith("/games/learning/browser-round") &&
      route.request().method() === "GET"
    )
      return route.fulfill({
        json: {
          sessionId: "browser-round",
          questions: content.questions,
          answers: saved,
          endedAt: finished ? new Date().toISOString() : null,
          selection,
        },
      });
    if (pathname.endsWith("/games/learning/browser-round/finish")) {
      if (!finished) {
        completions++;
        finished = true;
      }
      if (options.dropFinish && !droppedFinish) {
        droppedFinish = true;
        return route.fulfill({
          status: 503,
          json: { message: "Dropped completion response" },
        });
      }
      return route.fulfill({
        json: {
          id: "browser-round",
          score: 10,
          correctAnswers: 1,
          wrongAnswers: 1,
          endedAt: new Date().toISOString(),
        },
      });
    }
    return route.fulfill({
      status: 503,
      json: { message: "Unused test endpoint" },
    });
  });
  return {
    ...content,
    saved,
    submitted,
    starts,
    completions: () => completions,
  };
}

async function enterAnswer(page: Page, type: LearningGameType, value: string) {
  if (type === "sentence-builder") {
    for (const word of value.split(" "))
      await page
        .getByRole("button", { name: `Add ${word}`, exact: true })
        .click();
  } else if (type === "plural")
    await page.getByLabel("Plural with die").fill(value);
  else if (type === "grammar-detective")
    await page.getByLabel("Rewrite the correct sentence").fill(value);
  else
    await page
      .getByRole("button", {
        name: new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      })
      .click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
}

test("topic selection is sent to guest practice and adaptive mode requires sign-in", async ({
  page,
}) => {
  const data = await mockGames(page, "collocations");
  await page.goto("/en/games/collocations");
  await page.getByRole("button", { name: "A2", exact: true }).click();
  await page.getByRole("button", { name: "Shopping", exact: true }).click();
  await expect(page.getByRole("switch")).toBeDisabled();
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  expect(data.starts).toEqual([
    {
      gameType: "collocations",
      level: "A2",
      topic: "shopping",
      adaptive: false,
    },
  ]);
  await expect(page.getByText("A2 · Question 1/2 · Shopping")).toBeVisible();
});

test("adaptive level and topic remain visible when an authenticated round is resumed", async ({
  page,
}) => {
  const data = await mockGames(page, "plural", {
    authenticated: true,
    adaptiveLevel: "A2",
  });
  await page.goto("/en/games/plural");
  await page.getByRole("button", { name: "A1", exact: true }).click();
  await page.getByRole("button", { name: "Health", exact: true }).click();
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  expect(data.starts[0]).toMatchObject({
    level: "A1",
    topic: "health",
    adaptive: true,
  });
  await expect(page.getByText("A2 · Question 1/2 · Health")).toBeVisible();
  await expect(
    page.getByText("You did well at A1. This round tries A2."),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Resume previous round", exact: true })
    .click();
  await expect(page.getByText("A2 · Question 1/2 · Health")).toBeVisible();
  await expect(
    page.getByText("You did well at A1. This round tries A2."),
  ).toBeVisible();
});

test("adaptive rounds keep the new level when starting the next round", async ({
  page,
}) => {
  const data = await mockGames(page, "plural", {
    authenticated: true,
    adaptiveLevel: "A2",
  });
  await page.goto("/en/games/plural");
  await page.getByRole("button", { name: "A1", exact: true }).click();
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  await enterAnswer(page, "plural", data.answers[0]!);
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await enterAnswer(page, "plural", data.answers[1]!);
  await page.getByRole("button", { name: "Show results", exact: true }).click();
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "A2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  expect(data.starts[1]).toMatchObject({ level: "A2", adaptive: true });
});

test("turning adaptive mode off keeps the chosen level", async ({ page }) => {
  const data = await mockGames(page, "plural", {
    authenticated: true,
    adaptiveLevel: "B1",
  });
  await page.goto("/en/games/plural");
  await page.getByRole("button", { name: "A2", exact: true }).click();
  await page.screenshot({
    path: ".audit-games-topics-light.png",
    fullPage: true,
  });
  await page.getByRole("switch").click();
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  expect(data.starts[0]).toMatchObject({ level: "A2", adaptive: false });
  await expect(page.getByText("A2 · Question 1/2")).toBeVisible();
  await expect(
    page.getByText("This round keeps your selected level: A2."),
  ).toBeVisible();
});

for (const type of Object.keys(names) as LearningGameType[]) {
  test(`${type} completes a round and revisits only mistakes`, async ({
    page,
  }) => {
    const data = await mockGames(page, type);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/en/games/${type}`);
    await expect(
      page.getByRole("heading", { name: names[type], exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Start playing", exact: true })
      .click();
    await enterAnswer(
      page,
      type,
      type === "sentence-builder" ? "Deutsch Ich lerne" : "wrong-answer",
    );
    await expect(
      page.getByRole("heading", { name: "Remember for next time" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .click();
    if (type === "dialogue")
      await expect(
        page.getByText("Einen Kaffee, bitte.", { exact: true }),
      ).toBeVisible();
    await enterAnswer(page, type, data.answers[1]!);
    await expect(
      page.getByRole("heading", { name: "Correct!", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Show results", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "What did you practise?" }),
    ).toBeVisible();
    await expect(
      page.getByText("This was guest practice.", { exact: false }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Practise missed questions", exact: true })
      .click();
    await expect(
      page.getByText("Question 1/1", { exact: false }),
    ).toBeVisible();
    await enterAnswer(page, type, data.answers[0]!);
    await page
      .getByRole("button", { name: "Show results", exact: true })
      .click();
    await expect(
      page.getByText("Mistakes practised again.", { exact: false }),
    ).toBeVisible();
    expect(data.completions()).toBe(0);
    expect(errors).toEqual([]);
  });
}

test("answer retries keep the submitted value and recover a lost response", async ({
  page,
}) => {
  const data = await mockGames(page, "collocations", { dropAnswer: true });
  await page.goto("/en/games/collocations");
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  await enterAnswer(page, "collocations", "wrong-answer");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Your answer could not be confirmed",
  );
  await expect(page.getByRole("button", { name: /mache/ })).toBeDisabled();
  await page
    .getByRole("button", { name: "Resend answer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Remember for next time" }),
  ).toBeVisible();
  expect(data.submitted).toEqual(["wrong-answer", "wrong-answer"]);
  expect(data.saved).toHaveLength(1);
});

test("authenticated progress resumes after reload and completion retries preserve the result", async ({
  page,
}) => {
  const data = await mockGames(page, "plural", {
    authenticated: true,
    dropFinish: true,
  });
  await page.goto("/en/games/plural");
  await page.getByRole("button", { name: "A2", exact: true }).click();
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  await enterAnswer(page, "plural", "wrong-answer");
  await expect(
    page.getByRole("heading", { name: "Remember for next time" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Resume previous round", exact: true })
    .click();
  await expect(page.getByText("A2 · Question 2/2")).toBeVisible();
  await enterAnswer(page, "plural", data.answers[1]!);
  await page.getByRole("button", { name: "Show results", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Your answers are saved",
  );
  await page.getByRole("button", { name: "Show results", exact: true }).click();
  await expect(
    page.getByText("Results saved to your history.", { exact: false }),
  ).toBeVisible();
  expect(data.completions()).toBe(1);
  expect(data.saved).toHaveLength(2);
  await expect(
    page.getByRole("link", { name: "Open error notebook" }),
  ).toHaveAttribute("href", "/en/error-notebook");
});

test("challenge expiration submits one skip and displays feedback", async ({
  page,
}) => {
  const data = await mockGames(page, "collocations");
  await page.goto("/en/games/collocations");
  await page.getByRole("button", { name: "Challenge", exact: true }).click();
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check answer" }),
  ).toBeVisible();
  await page.clock.install();
  await page.clock.runFor(46000);
  await expect(
    page.getByRole("heading", { name: "Remember for next time" }),
  ).toBeVisible();
  expect(data.submitted).toEqual([""]);
});

test("word choices support keyboard selection", async ({ page }) => {
  await mockGames(page, "collocations");
  await page.goto("/en/games/collocations");
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  await page.keyboard.press("2");
  await expect(page.getByRole("button", { name: /mache/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Correct!", exact: true }),
  ).toBeVisible();
});

for (const [locale, title, start] of [
  ["vi", "Xếp câu", "Bắt đầu chơi"],
  ["en", "Sentence Builder", "Start playing"],
  ["de", "Satzbau", "Spiel starten"],
]) {
  test(`${locale} mobile game uses the saved dark theme and fits the viewport`, async ({
    page,
  }) => {
    await mockGames(page, "sentence-builder");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() =>
      localStorage.setItem(
        "deutschmeister-settings",
        JSON.stringify({ theme: "dark" }),
      ),
    );
    await page.goto(`/${locale}/games/sentence-builder`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.audit-games-${locale}-setup.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: start, exact: true }).click();
    await expect(page.getByRole("progressbar")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.audit-games-${locale}-mobile.png`,
      fullPage: true,
    });
  });
}

test("German character buttons insert at the input cursor", async ({
  page,
}) => {
  await mockGames(page, "plural");
  await page.goto("/en/games/plural");
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  const input = page.getByLabel("Plural with die");
  await input.fill("die Bcher");
  await input.evaluate((element) =>
    (element as HTMLInputElement).setSelectionRange(5, 5),
  );
  await page.getByRole("button", { name: "ü", exact: true }).click();
  await expect(input).toHaveValue("die Bücher");
  await input.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Correct!", exact: true }),
  ).toBeVisible();
});

test("sentence tiles can be removed and reused before submitting", async ({
  page,
}) => {
  await mockGames(page, "sentence-builder");
  await page.goto("/en/games/sentence-builder");
  await page
    .getByRole("button", { name: "Start playing", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Ich", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add Ich", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Remove Ich", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add Ich", exact: true }),
  ).toBeEnabled();
  await enterAnswer(page, "sentence-builder", "Ich lerne Deutsch");
  await expect(
    page.getByRole("heading", { name: "Correct!", exact: true }),
  ).toBeVisible();
});

test("the games hub links to all six new adventures", async ({ page }) => {
  await mockGames(page, "sentence-builder");
  await page.addInitScript(() =>
    localStorage.setItem(
      "deutschmeister-settings",
      JSON.stringify({ theme: "light" }),
    ),
  );
  await page.goto("/en/games");
  await expect(
    page.getByRole("heading", { name: "6 new learning adventures" }),
  ).toBeVisible();
  for (const type of Object.keys(names) as LearningGameType[])
    await expect(
      page.locator(`a[href="/en/games/${type}"]`).first(),
    ).toBeVisible();
  await page.screenshot({ path: ".audit-games-hub-light.png", fullPage: true });
});
