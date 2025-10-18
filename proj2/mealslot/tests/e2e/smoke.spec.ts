import { test, expect } from "@playwright/test";

test("home renders and can toggle categories", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("MealSlot")).toBeVisible();
  await page.getByRole("button", { name: "dessert" }).click();
  await expect(page.getByRole("button", { name: "Spin" })).toBeVisible();
});
