import { test, expect, ConsoleMessage } from '@playwright/test';

/** Console errors that come from the Firebase SDK trying to reach the network
 *  in a sandboxed / offline environment — not related to the component. */
const FIREBASE_NOISE_RE = /firebaseinstallations|firebaseapp\.com|ERR_NAME_NOT_RESOLVED|Failed to fetch|Failed to load resource/i;

test('ConfirmationDialog: open, verify visible, confirm, verify closed, no console errors', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !FIREBASE_NOISE_RE.test(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });

  // Step 1: Open the page
  await page.goto('/test/confirmation-dialog');

  // Step 2: Click the button that opens the dialog
  const openBtn = page.getByTestId('open-dialog-btn');
  await expect(openBtn).toBeVisible();
  await openBtn.click();

  // Step 3: Verify dialog is visible (not just in DOM)
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByText('Delete item')).toBeVisible();
  await expect(page.getByText('Are you sure you want to delete this item?')).toBeVisible();

  // Check: dialog overlays the page (z-index >= 100)
  const zIndex = await dialog.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return parseInt(computed.zIndex, 10);
  });
  expect(zIndex).toBeGreaterThanOrEqual(100);

  // Check: focus is trapped inside the dialog
  const focusedInDialog = await page.evaluate(() => {
    const active = document.activeElement;
    const dlg = document.querySelector('[role="alertdialog"]');
    return dlg != null && (dlg === active || dlg.contains(active));
  });
  expect(focusedInDialog).toBe(true);

  // Step 4: Click confirm
  await page.getByRole('button', { name: 'Delete' }).click();

  // Step 5: Verify dialog disappears
  await expect(dialog).not.toBeVisible();

  // Verify confirmation was registered
  await expect(page.getByTestId('result')).toHaveText('confirmed');

  // Step 6: Verify no application-level console errors
  expect(consoleErrors).toHaveLength(0);
});
