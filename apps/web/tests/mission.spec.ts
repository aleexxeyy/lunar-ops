import { expect, test, type Page } from "@playwright/test";
import type { MissionView } from "@lunar-ops/contracts";

async function state(page: Page): Promise<MissionView> {
  const id = await page.evaluate(() =>
    localStorage.getItem("lunar-ops-session-v1"),
  );
  const response = await page.request.get(`/api/sessions/${id}`);
  return response.json() as Promise<MissionView>;
}
async function act(page: Page, name: string | RegExp): Promise<void> {
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/commands") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name }).first().click();
  expect((await response).status()).toBe(201);
  await expect(page.locator(".connection")).toContainText("КАНАЛ АКТИВЕН");
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Завершить день" }),
  ).toBeEnabled();
});

test("dashboard, views, dialogs, navigation, assignments and export work", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Орбита", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /Орбитальная схема/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Поверхность", exact: true }).click();
  await page.getByRole("button", { name: /Солнечный массив: детали/ }).click();
  await expect(page.getByRole("dialog")).toContainText("УРОВЕНЬ 1");
  await act(page, "Улучшить модуль");
  await expect(page.getByRole("dialog")).toContainText("УРОВЕНЬ 2");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Энергия:.*Открыть/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Прогноз за день");
  await page.getByRole("button", { name: "Закрыть диалог" }).click();
  await page.getByRole("button", { name: "Как играть" }).click();
  await expect(page.getByRole("dialog")).toContainText("Протокол командира");
  await page.getByRole("button", { name: "Принять командование" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Лунная база", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Модули станции" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Экипаж", exact: true })
    .click();
  await page.getByRole("button", { name: "Назначить роль" }).first().click();
  await act(page, /Исследователь.*науки/);
  await expect(
    page.getByRole("dialog").getByRole("button", { name: /Исследователь/ }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Журнал миссии", exact: true })
    .click();
  await page.getByRole("button", { name: "События", exact: true }).click();
  await expect(
    page.getByText("Записей пока нет.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Операции", exact: true }).click();
  await expect(page.locator(".log-list")).toContainText("назначение");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт JSON" }).click();
  expect((await downloaded).suggestedFilename()).toContain(
    "lunar-ops-day-1.json",
  );
  expect(errors).toEqual([]);
});

test("operations, event decisions, reload and complete mission work", async ({
  page,
}) => {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Лунная база", exact: true })
    .click();
  await act(page, /^Улучшить$/);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Командный центр", exact: true })
    .click();
  await act(page, /Исследовать реголит/);
  await expect(
    page.getByRole("button", { name: /Переработать воду/ }),
  ).toBeDisabled();
  const before = await state(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Завершить день" }),
  ).toBeEnabled();
  expect((await state(page)).revision).toBe(before.revision);
  await act(page, "Завершить день");
  await expect(
    page.getByRole("heading", { name: "Солнечная буря" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Завершить день" }),
  ).toBeDisabled();
  for (let step = 0; step < 7; step += 1) {
    let current = await state(page);
    if (current.status !== "active") break;
    if (current.pendingEvent)
      await act(page, new RegExp(current.pendingEvent.choices.at(-1)!.label));
    current = await state(page);
    if (
      current.resources.water < 60 &&
      current.availableActions.water.available
    )
      await act(page, /Переработать воду/);
    current = await state(page);
    if (
      current.resources.oxygen < 60 &&
      current.availableActions.oxygen.available
    )
      await act(page, /Восстановить кислород/);
    current = await state(page);
    if (current.science < 60 && current.availableActions.research.available)
      await act(page, /Исследовать реголит/);
    await act(page, "Завершить день");
  }
  await expect(
    page.getByRole("heading", { name: "Миссия выполнена, командир." }),
  ).toBeVisible();
  expect((await state(page)).completedDays).toBe(7);
  await expect(
    page.getByRole("button", { name: "Завершить день" }),
  ).toBeDisabled();
});

test("new mission confirms difficulty and replaces the old session", async ({
  page,
}) => {
  const oldId = (await state(page)).id;
  await page.getByRole("button", { name: "Новая миссия" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Командир/ })
    .click();
  await page.getByRole("button", { name: "Запустить экспедицию" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const next = await state(page);
  expect(next.difficulty).toBe("commander");
  expect(next.id).not.toBe(oldId);
  expect(next.revision).toBe(0);
});

test("connection failures and expired sessions can be recovered", async ({
  page,
}) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Нет связи");
  await page.unroute("**/api/**");
  await page.getByRole("button", { name: "Переподключить" }).click();
  await expect(
    page.getByRole("button", { name: "Завершить день" }),
  ).toBeEnabled();
  await page.evaluate(() =>
    localStorage.setItem("lunar-ops-session-v1", "expired-session"),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Завершить день" }),
  ).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("Создана новая миссия");
});
