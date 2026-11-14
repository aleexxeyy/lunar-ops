import { expect, type Page, type Locator } from "@playwright/test";
import type { MissionView } from "@lunar-ops/contracts";

export async function state(page: Page): Promise<MissionView> {
  const id = await page.evaluate(() =>
    localStorage.getItem("lunar-ops-session-v1"),
  );
  const response = await page.request.get(`/api/sessions/${id}`);
  expect(response.ok()).toBe(true);
  return response.json() as Promise<MissionView>;
}

export async function act(
  page: Page,
  target: string | RegExp | Locator,
): Promise<void> {
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/commands") && r.request().method() === "POST",
  );
  const button =
    typeof target === "string" || target instanceof RegExp
      ? page.getByRole("button", { name: target }).first()
      : target;
  await button.click();
  expect((await response).status()).toBe(201);
  await expect(page.locator(".connection")).toContainText("КАНАЛ АКТИВЕН");
}

export async function go(page: Page, name: string): Promise<void> {
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
  await expect(
    page.getByRole("navigation").getByRole("button", { name, exact: true }),
  ).toHaveAttribute("aria-current", "page");
}
