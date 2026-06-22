import { test, expect } from '@playwright/test';

test.describe('Customer Ordering Flow', () => {
  test('should show error for invalid QR token', async ({ page }) => {
    await page.goto('/scan?token=invalid-token');
    await expect(page.locator('text=invalid')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to menu after valid QR scan', async ({ page }) => {
    // This test requires a valid QR token from the test environment
    // In CI, this would be seeded via API before the test
    test.skip(true, 'Requires seeded QR token');

    await page.goto('/scan?token=valid-test-token');
    await expect(page).toHaveURL('/menu', { timeout: 5000 });
  });

  test('should display menu categories and items', async ({ page }) => {
    // Requires active session
    test.skip(true, 'Requires active customer session');

    await page.goto('/menu');
    await expect(page.locator('[data-testid="category-tab"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="menu-item"]').first()).toBeVisible();
  });

  test('should add item to cart', async ({ page }) => {
    test.skip(true, 'Requires active customer session');

    await page.goto('/menu');
    await page.click('[data-testid="menu-item"]:first-child button');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('should place order from cart', async ({ page }) => {
    test.skip(true, 'Requires active customer session with cart items');

    await page.goto('/cart');
    await page.click('text=Place Order');
    await expect(page).toHaveURL(/\/order\//);
  });
});
