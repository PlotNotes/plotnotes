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

test('Create Short Story scenario', async ({ page }) => {

  await page.goto('http://localhost:3000/signin');

  await page.fill('input[name="loginUsername"]', 'testuser');
  await page.fill('input[name="loginPassword"]', 'testpassword');

  const navigationPromise = page.waitForNavigation();
  await page.click('button:has-text("Login")');
  await navigationPromise;

  await page.goto('http://localhost:3000/prompt');

  // Input a prompt
  await page.fill('textarea', 'Once upon a time in the wild west');

  // Trigger the story creation and wait for network responses
  const [responsePrompt] = await Promise.all([      
      page.click('button:has-text("Create Short Story")'),
      page.waitForResponse('http://localhost:3000/api/prompt'),
  ]);

  // Tests the copy button
  await page.click('button:has-text("Copy")');

  // Checks the copied text by selecting all text, and then pasting it into the textarea
  await page.click('textarea');
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyA', { delay: 100 });
  await page.keyboard.up('Meta');
  await page.keyboard.press('Backspace');
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyV', { delay: 100 });
  await page.keyboard.up('Meta');

  // Gets the text from the textarea
  const clipboardText = await page.$eval('textarea', (el: any) => el.value);

  // Checks to see that the textarea is not empty and does not have the prompt
  expect(clipboardText).not.toBe("");
  expect(clipboardText).not.toBe("Once upon a time in the wild west");

});

test('Create Chapter scenario', async ({ page }) => {

  await page.goto('http://localhost:3000/signin');

  await page.fill('input[name="loginUsername"]', 'testuser');
  await page.fill('input[name="loginPassword"]', 'testpassword');

  const navigationPromise = page.waitForNavigation();
  await page.click('button:has-text("Login")');
  await navigationPromise;

  await page.goto('http://localhost:3000/prompt');

  // Input a prompt
  await page.fill('textarea', 'Once upon a time in the wild west');

  // Trigger the story creation and wait for network responses
  const [responsePrompt] = await Promise.all([
      page.click('button:has-text("Create Chapter")'),
      page.waitForResponse('http://localhost:3000/api/prompt'),
  ]);

  // Tests the copy button
  await page.click('button:has-text("Copy")');

  // Checks the copied text by selecting all text, and then pasting it into the textarea
  await page.click('textarea');
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyA', { delay: 100 });
  await page.keyboard.up('Meta');
  await page.keyboard.press('Backspace');
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyV', { delay: 100 });
  await page.keyboard.up('Meta');

  // Gets the text from the textarea
  const clipboardText = await page.$eval('textarea', (el: any) => el.value);

  // Checks to see that the textarea is not empty and does not have the prompt
  expect(clipboardText).not.toBe("");
  expect(clipboardText).not.toBe("Once upon a time in the wild west");
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