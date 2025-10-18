import { test, expect } from "@playwright/test";

test("full smoke: spin → cook at home modal", async ({ page }) => {
  await page.goto("/");

  // visible header
  await expect(page.getByText("MealSlot")).toBeVisible();

  // click Spin
  const spinBtn = page.getByRole("button", { name: "Spin" });
  await expect(spinBtn).toBeVisible();
  await spinBtn.click();

  // wait for Selected Dishes section
  await expect(page.getByRole("heading", { name: "Selected Dishes" })).toBeVisible();

  // open Cook at Home (loads recipes and opens modal)
  await page.getByRole("button", { name: "Cook at Home" }).click();

  // modal should appear with Ingredients list
  const dialog = page.getByRole("dialog", { name: /Cook at Home — Recipes/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Ingredients")).toBeVisible();

  // close modal
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(dialog).toBeHidden();
});
