import { expect, test } from "@playwright/test";
import { act, state } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
  ).toBeEnabled();
});

test("dashboard, views, dialogs, navigation, assignments and export work", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  await expect(page).toHaveTitle("Lunar Ops — Центр керування місією");
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Орбіта", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /Орбітальна схема/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Поверхня", exact: true }).click();
  await page.getByRole("button", { name: /Сонячні панелі: деталі/ }).click();
  await expect(page.getByRole("dialog")).toContainText("РІВЕНЬ 1");
  await act(page, "Поліпшити модуль");
  await expect(page.getByRole("dialog")).toContainText("РІВЕНЬ 2");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Енергія:.*Відкрити/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Прогноз за день");
  await page.getByRole("button", { name: "Закрити діалог" }).click();
  await page.getByRole("button", { name: "Як грати" }).click();
  await expect(page.getByRole("dialog")).toContainText("Протокол командира");
  await page.getByRole("button", { name: "Прийняти командування" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Місячна база", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Модулі станції" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Екіпаж", exact: true })
    .click();
  await page.getByRole("button", { name: "Призначити роль" }).first().click();
  await act(page, /Дослідник.*наукові/);
  await expect(
    page.getByRole("dialog").getByRole("button", { name: /Дослідник/ }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Журнал місії", exact: true })
    .click();
  await page.getByRole("button", { name: "Події", exact: true }).click();
  await expect(
    page.getByText("Записів поки немає.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Операції", exact: true }).click();
  await expect(page.locator(".log-list")).toContainText("призначення");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Експорт JSON" }).click();
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
    .getByRole("button", { name: "Місячна база", exact: true })
    .click();
  await act(page, /^Поліпшити$/);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Командний центр", exact: true })
    .click();
  await act(page, /Дослідити реголіт/);
  await expect(
    page.getByRole("button", { name: /Очистити воду/ }),
  ).toBeDisabled();
  const before = await state(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
  ).toBeEnabled();
  expect((await state(page)).revision).toBe(before.revision);
  await act(page, "Завершити день");
  await expect(
    page.getByRole("heading", { name: "Сонячна буря" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
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
      await act(page, /Очистити воду/);
    current = await state(page);
    if (
      current.resources.oxygen < 60 &&
      current.availableActions.oxygen.available
    )
      await act(page, /Поповнити запас кисню/);
    current = await state(page);
    if (current.science < 60 && current.availableActions.research.available)
      await act(page, /Дослідити реголіт/);
    await act(page, "Завершити день");
  }
  await expect(
    page.getByRole("heading", { name: "Місію виконано, командире." }),
  ).toBeVisible();
  expect((await state(page)).completedDays).toBe(7);
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
  ).toBeDisabled();
});

test("new mission confirms difficulty and replaces the old session", async ({
  page,
}) => {
  const oldId = (await state(page)).id;
  await page.getByRole("button", { name: "Нова місія" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Командир/ })
    .click();
  await page.getByRole("button", { name: "Розпочати експедицію" }).click();
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
  await expect(page.getByRole("alert")).toContainText("Немає зв’язку");
  await page.unroute("**/api/**");
  await page.getByRole("button", { name: "Підключитися знову" }).click();
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
  ).toBeEnabled();
  await page.evaluate(() =>
    localStorage.setItem("lunar-ops-session-v1", "expired-session"),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Завершити день" }),
  ).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("Створено нову місію");
});
