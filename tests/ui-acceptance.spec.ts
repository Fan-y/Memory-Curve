import { test, expect, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const SMOKE_TEST_EMAIL = process.env.SMOKE_TEST_EMAIL;
const SMOKE_TEST_PASSWORD = process.env.SMOKE_TEST_PASSWORD;

test.describe.configure({ mode: "serial" });

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });

  expect(hasOverflow).toBeFalsy();
}

test("desktop en-US auth pages", async ({ browser }) => {
  const context = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/auth/login`);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByText("Sign in with email and password, or use a third-party account.")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(`${BASE_URL}/auth/signup`);
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.getByText("Display Name (Optional)")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(`${BASE_URL}/auth/reset-password`);
  await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.screenshot({ path: "/tmp/ui-acceptance-desktop-en.png", fullPage: true });
  await context.close();
});

test("desktop zh-CN setup and 404 pages", async ({ browser }) => {
  const context = await browser.newContext({
    locale: "zh-CN",
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/setup`);
  await expect(page.getByRole("heading", { name: "需要先完成 Supabase 配置" })).toBeVisible();
  await expect(page.getByText("当前应用已切换为真实认证流程，请按下面步骤完成阶段 1 外部配置。")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(`${BASE_URL}/does-not-exist`);
  await expect(page.getByText("页面不存在或已被移动。")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.screenshot({ path: "/tmp/ui-acceptance-desktop-zh.png", fullPage: true });
  await context.close();
});

test("mobile en-US auth layout", async ({ browser }) => {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    locale: "en-US",
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/auth/login`);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "GitHub" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.screenshot({ path: "/tmp/ui-acceptance-mobile-en.png", fullPage: true });
  await context.close();
});

test("optional authenticated desktop shell", async ({ browser }) => {
  test.skip(
    !SMOKE_TEST_EMAIL || !SMOKE_TEST_PASSWORD,
    "SMOKE_TEST_EMAIL/SMOKE_TEST_PASSWORD not configured"
  );

  const context = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/auth/login`);
  await page.getByLabel("Email").fill(SMOKE_TEST_EMAIL!);
  await page.getByLabel("Password").fill(SMOKE_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL(`${BASE_URL}/`);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await context.close();
});
