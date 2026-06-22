import { test, expect } from '@playwright/test';

test.describe('Restaurant Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as demo owner
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@demo.com');
    await page.fill('input[type="password"]', 'Owner@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/overview', { timeout: 5000 });
  });

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Today\'s Orders')).toBeVisible();
  });

  test('should navigate to menu management', async ({ page }) => {
    await page.click('text=Menu');
    await expect(page).toHaveURL('/dashboard/menu');
    await expect(page.locator('h1')).toContainText('Menu');
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.click('text=Orders');
    await expect(page).toHaveURL('/dashboard/orders');
    await expect(page.locator('h1')).toContainText('Orders');
  });

  test('should navigate to kitchen display', async ({ page }) => {
    await page.click('text=Kitchen');
    await expect(page).toHaveURL('/dashboard/kitchen');
    await expect(page.locator('h1')).toContainText('Kitchen Display');
  });

  test('should navigate to tables', async ({ page }) => {
    await page.click('text=Tables');
    await expect(page).toHaveURL('/dashboard/tables');
    await expect(page.locator('h1')).toContainText('Tables');
  });

  test('should navigate to analytics', async ({ page }) => {
    await page.click('text=Analytics');
    await expect(page).toHaveURL('/dashboard/analytics');
    await expect(page.locator('h1')).toContainText('Analytics');
  });

  test('should navigate to settings', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL('/dashboard/settings');
    await expect(page.locator('h1')).toContainText('Restaurant Settings');
  });

  test('should logout successfully', async ({ page }) => {
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login');
  });
});
