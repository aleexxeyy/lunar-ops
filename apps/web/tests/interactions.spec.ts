import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { MissionView } from "@lunar-ops/contracts";
import { act, go, state } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
  ).toBeEnabled();
});

test("navigation supports reload, browser history, shortcuts and keyboard focus", async ({
  page,
}) => {
  await go(page, "Місячна база");
  await expect(page).toHaveURL(/#\/station$/);
  await go(page, "Екіпаж");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Команда місії" }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Системи станції" }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Команда місії" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Перейти до операцій" }).click();
  await expect(page).toHaveURL(/#\/overview$/);
  await page.getByRole("button", { name: "Керування", exact: true }).click();
  await expect(page).toHaveURL(/#\/crew$/);
  await go(page, "Командний центр");
  await page.getByRole("button", { name: "Усі записи", exact: true }).click();
  await expect(page).toHaveURL(/#\/journal$/);
  if (
    await page
      .getByRole("button", { name: "Lunar Ops — командний центр" })
      .isVisible()
  ) {
    await page
      .getByRole("button", { name: "Lunar Ops — командний центр" })
      .click();
    await page.getByRole("button", { name: "Протокол командира" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await page.getByRole("link", { name: "До вмісту" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const item of [
  {
    resource: "Енергія",
    key: "energy",
    action: "Поліпшити модуль",
    module: "Сонячні панелі",
  },
  {
    resource: "Кисень",
    key: "oxygen",
    action: "Поповнити запас кисню",
    module: "Система життєзабезпечення",
  },
  {
    resource: "Вода",
    key: "water",
    action: "Очистити воду",
    module: "Гідропонний відсік",
  },
  {
    resource: "Настрій",
    key: "morale",
    action: "Відпочинок екіпажу",
    module: "Гідропонний відсік",
  },
] as const) {
  test(`${item.resource}: chart, resource dialog and contextual action use real state`, async ({
    page,
  }) => {
    const legend = page
      .locator(".chart-legend")
      .getByRole("button", { name: item.resource, exact: true });
    await legend.click();
    await expect(legend).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("img", { name: new RegExp(`Історія: ${item.resource}`) }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: new RegExp(`^${item.resource}:`) })
      .click();
    await expect(page.getByRole("dialog")).toContainText("Прогноз за день");
    if (item.key === "energy")
      await page
        .getByRole("dialog")
        .getByRole("button", { name: item.module, exact: true })
        .click();
    await act(
      page,
      page
        .getByRole("dialog")
        .getByRole("button", { name: item.action, exact: true }),
    );
    const after = await state(page);
    expect(after.actionsRemaining).toBe(1);
    if (item.key === "energy") expect(after.modules.solar).toBe(2);
    else {
      expect(after.resources[item.key]).toBe(100);
      await expect(
        page
          .getByRole("dialog")
          .getByRole("button", { name: item.action, exact: true }),
      ).toBeDisabled();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: item.module, exact: true })
        .click();
      await expect(
        page.getByRole("dialog").getByRole("heading", { name: item.module }),
      ).toBeVisible();
    }
    await page.getByRole("button", { name: "Закрити діалог" }).click();
    await expect(
      page.getByRole("button", {
        name: new RegExp(`^${item.resource}: ${after.resources[item.key]}%`),
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Закрити сповіщення" }).click();
    await expect(page.locator(".toast")).not.toBeVisible();
  });
}

test("every station hotspot opens its module and upgrades stop at the level cap", async ({
  page,
}) => {
  for (const name of [
    "Сонячні панелі",
    "Система життєзабезпечення",
    "Гідропонний відсік",
    "Наукова лабораторія",
  ]) {
    await page.getByRole("button", { name: `${name}: деталі модуля` }).click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await go(page, "Місячна база");
  const solar = page.locator(".module-row").filter({ hasText: "PWR-01" });
  await act(
    page,
    solar.getByRole("button", { name: "Поліпшити", exact: true }),
  );
  await act(
    page,
    solar.getByRole("button", { name: "Поліпшити", exact: true }),
  );
  await expect(solar).toContainText("РІВЕНЬ 3");
  await expect(solar.getByRole("button")).toBeDisabled();
  await act(page, "Завершити день");
  await page
    .getByRole("button", { name: /Потрібне рішення: Сонячна буря/ })
    .click();
  const before = await state(page);
  await act(page, /Активувати захист/);
  expect((await state(page)).resources.energy).toBe(
    before.resources.energy - 14,
  );
  await go(page, "Місячна база");
  await expect(solar).toContainText("Досягнуто максимального рівня");
  await expect(solar.getByRole("button")).toBeDisabled();
});

test("every crew member can be reassigned to each role without spending operations", async ({
  page,
}) => {
  await go(page, "Екіпаж");
  for (let index = 0; index < 3; index += 1) {
    await page
      .getByRole("button", { name: "Призначити роль" })
      .nth(index)
      .click();
    for (const name of ["Медик", "Дослідник", "Інженер"]) {
      const button = page
        .getByRole("dialog")
        .getByRole("button", { name: new RegExp(name) });
      if (await button.isEnabled()) await act(page, button);
      await expect(button).toBeDisabled();
    }
    await page.keyboard.press("Escape");
  }
  const current = await state(page);
  expect(current.crew.every((member) => member.role === "engineer")).toBe(true);
  expect(current.actionsRemaining).toBe(2);
  expect(current.forecast.energy).toBe(-3);
});

test("journal filters match server entries and export contains the current mission", async ({
  page,
}) => {
  await act(page, /Дослідити реголіт/);
  await act(page, "Завершити день");
  await act(page, /Перечекати в укритті/);
  await go(page, "Журнал місії");
  const current = await state(page);
  for (const [label, kind] of [
    ["Події", "event"],
    ["Операції", "action"],
    ["Усі записи", "all"],
  ] as const) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".log-entry")).toHaveCount(
      current.log.filter((entry) => kind === "all" || entry.kind === kind)
        .length,
    );
  }
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Експорт JSON" }).click();
  const file = await (await download).path();
  expect(JSON.parse(await readFile(file!, "utf8"))).toEqual(current);
});

test("a double click cannot submit two operations", async ({ page }) => {
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/commands", async (route) => {
    requests += 1;
    await gate;
    await route.continue();
  });
  await page
    .getByRole("button", { name: /Дослідити реголіт/ })
    .evaluate((button) => {
      if (!(button instanceof HTMLButtonElement))
        throw new Error("Expected an operation button");
      button.click();
      button.click();
    });
  await expect(
    page.getByRole("button", { name: /Очистити воду/ }),
  ).toBeDisabled();
  release();
  await expect(page.locator(".connection")).toContainText("КАНАЛ АКТИВНИЙ");
  expect(requests).toBe(1);
  expect((await state(page)).revision).toBe(1);
});

test("offline commands are blocked and can be recovered from inside a dialog", async ({
  page,
}) => {
  const before = await state(page);
  await page.route("**/api/**", (route) => route.abort());
  await page.getByRole("button", { name: /Дослідити реголіт/ }).click();
  await expect(page.locator(".connection")).toContainText("ПЕРЕВІРТЕ ЗВ’ЯЗОК");
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Сонячні панелі: деталі/ }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Поліпшити модуль" }),
  ).toBeDisabled();
  await page.unroute("**/api/**");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Підключитися знову" })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Поліпшити модуль" }),
  ).toBeEnabled();
  expect((await state(page)).id).toBe(before.id);
  expect((await state(page)).revision).toBe(0);
  await act(page, "Поліпшити модуль");
});

test("a lost successful response reconciles state without repeating the operation", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/commands", async (route) => {
    requests += 1;
    await route.fetch();
    await route.abort();
  });
  await page.getByRole("button", { name: /Дослідити реголіт/ }).click();
  await expect(page.locator(".toast")).toContainText("Зв’язок відновлено");
  await expect(page.locator(".connection")).toContainText("КАНАЛ АКТИВНИЙ");
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(requests).toBe(1);
  expect((await state(page)).science).toBe(18);
  expect((await state(page)).actionsRemaining).toBe(1);
});

test("stale commands from another tab refresh state without a false offline indicator", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await other.goto("/");
  await expect(
    other.getByRole("button", { name: "Завершити день" }),
  ).toBeEnabled();
  await act(page, /Дослідити реголіт/);
  await other.getByRole("button", { name: /Відпочинок екіпажу/ }).click();
  await expect(other.getByRole("alert")).toContainText("іншій вкладці");
  await expect(other.locator(".connection")).toContainText("КАНАЛ АКТИВНИЙ");
  await expect(
    other.getByRole("button", { name: /Дослідити реголіт/ }),
  ).toBeDisabled();
  await other.getByRole("button", { name: "Зрозуміло", exact: true }).click();
  await act(other, /Відпочинок екіпажу/);
  expect((await state(other)).revision).toBe(2);
  await other.close();
});

test("reconnecting with storage disabled preserves the in-memory session", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage unavailable");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  const created = page.waitForResponse(
    (r) => r.url().endsWith("/sessions") && r.request().method() === "POST",
  );
  await page.reload();
  const initial = (await (await created).json()) as MissionView;
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
  ).toBeEnabled();
  await act(page, /Дослідити реголіт/);
  await page.route("**/api/**", (route) => route.abort());
  await page.getByRole("button", { name: /Відпочинок екіпажу/ }).click();
  await expect(page.locator(".connection")).toContainText("ПЕРЕВІРТЕ ЗВ’ЯЗОК");
  await page.unroute("**/api/**");
  let newSessions = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/sessions") && r.method() === "POST")
      newSessions += 1;
  });
  await page.getByRole("button", { name: "Підключитися знову" }).click();
  await expect(page.locator(".connection")).toContainText("КАНАЛ АКТИВНИЙ");
  await expect(
    page.getByRole("button", { name: /Дослідити реголіт/ }),
  ).toBeDisabled();
  await act(page, /Відпочинок екіпажу/);
  expect(newSessions).toBe(0);
  const current = (await (
    await page.request.get(`/api/sessions/${initial.id}`)
  ).json()) as MissionView;
  expect(current.revision).toBe(2);
});

test("a failed mission locks commands and the next-flight button creates a fresh mission", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Нова місія" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Командир/ })
    .click();
  await page.getByRole("button", { name: "Розпочати експедицію" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const id = (await state(page)).id;
  for (let index = 0; index < 7; index += 1) {
    const current = await state(page);
    if (current.status !== "active") break;
    if (current.pendingEvent)
      await act(page, new RegExp(current.pendingEvent.choices.at(-1)!.label));
    await act(page, "Завершити день");
  }
  await expect(
    page.getByRole("heading", { name: "Експедицію завершено." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Дослідити реголіт/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Наступний політ" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Кадет/ }).click();
  await page.getByRole("button", { name: "Розпочати експедицію" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect((await state(page)).id).not.toBe(id);
  expect((await state(page)).day).toBe(1);
});
