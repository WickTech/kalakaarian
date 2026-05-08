import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Kalakaarian/i);
  });
});

test.describe("Login Page", () => {
  test("shows email/password and WhatsApp OTP tabs", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Email / Password")).toBeVisible();
    await expect(page.getByText("WhatsApp OTP")).toBeVisible();
  });

  test("WhatsApp tab shows phone input after click", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("WhatsApp OTP").click();
    await expect(page.getByPlaceholder(/\+91/)).toBeVisible();
  });

  test("switching tabs clears errors", async ({ page }) => {
    await page.goto("/login");
    // Attempt login with no credentials to trigger error
    await page.getByRole("button", { name: /Sign In/i }).click();
    // Switch to WhatsApp tab and back — error should clear
    await page.getByText("WhatsApp OTP").click();
    await page.getByText("Email / Password").click();
    await expect(page.locator(".text-red-400")).toHaveCount(0);
  });
});

test.describe("Marketplace", () => {
  test("loads creator grid with skeleton or cards", async ({ page }) => {
    await page.goto("/marketplace");
    // Either skeleton cards or real cards must appear within 5s
    await expect(
      page.locator(".creator-card, [class*='animate-pulse']").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("filter drawer opens on Filters button click", async ({ page }) => {
    await page.goto("/marketplace");
    await page.getByRole("button", { name: /Filters/i }).click();
    await expect(page.getByText("Clear all filters")).toBeVisible();
  });
});

test.describe("Influencer Register", () => {
  test("shows 5-step wizard", async ({ page }) => {
    await page.goto("/influencer-register");
    await expect(page.getByText("Basic Info")).toBeVisible();
    await expect(page.getByText("Genre")).toBeVisible();
  });
});

test.describe("Brand Register", () => {
  test("shows work email warning for gmail", async ({ page }) => {
    await page.goto("/brand-register");
    const emailInput = page.getByPlaceholder("you@brand.com");
    await emailInput.fill("test@gmail.com");
    await emailInput.blur();
    await expect(page.getByText(/work\/business email/i)).toBeVisible();
  });
});
