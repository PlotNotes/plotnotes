import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects the URL to contain intro.
  await expect(page).toHaveURL(/.*intro/);
});

// Tests for the login page
test('login page', async ({ page }) => {
  await page.goto('http://localhost:3000/signin');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/PlotNotes/);
});

test('SignUp scenario', async ({ page }) => {
  await page.goto('http://localhost:3000/signin');

  const username = generateRandomString(20);
  await page.fill('input[name="signUpUsername"]', username);
  await page.fill('input[name="signUpPassword"]', 'testpassword');

  const navigationPromise = page.waitForNavigation();
  await page.click('button:has-text("Sign Up")');
  await navigationPromise;

  // Add additional assertions based on the expected behavior after sign up.
  expect(page.url()).toBe('http://localhost:3000/');
});

test('Login scenario', async ({ page }) => {
  await page.goto('http://localhost:3000/signin');

  await page.fill('input[name="loginUsername"]', 'testuser');
  await page.fill('input[name="loginPassword"]', 'testpassword');

  const navigationPromise = page.waitForNavigation();
  await page.click('button:has-text("Login")');
  await navigationPromise;

  // Add additional assertions based on the expected behavior after login.
  expect(page.url()).toBe('http://localhost:3000/');
});

// Helper function to generate random string
function generateRandomString(length: number) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}