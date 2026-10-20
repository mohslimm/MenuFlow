import { test, expect } from '@playwright/test';

test('utilisateur peut commencer une r\u00e9servation', async ({ page }) => {
  await page.goto('/book');
  
  // \u00c9tape 1
  await expect(page.locator('h1')).toContainText('R\u00e9server une table');
  
  // S\u00e9lectionner une date (aujourd'hui par d\u00e9faut ou premi\u00e8re dispo)
  await page.click('button:has-text("Choisir une date")');
  await page.click('.rdp-day_today');
  
  // Heure
  await page.click('button:has-text("S\u00e9lectionner une heure")');
  await page.click('span:has-text("19:00")');
  
  // Nom
  await page.fill('input#name', 'Test E2E');
  await page.fill('input#email', 'e2e@example.com');
  await page.fill('input#phone', '555-0199');
  
  await page.click('button:has-text("Continuer vers le menu")');
  
  // \u00c9tape 2
  await expect(page.locator('h2')).toContainText('Choix des plats');
  
  // Remplir pour le premier convive (index 0)
  // Note: Dans un vrai test, on bouclerait sur le partySize
  await page.click('div:has-text("Convive 1") >> button:has-text("Choisir une entr\u00e9e")');
  await page.click('span:has-text("Soupe \u00e0 l\'oignon")');
  
  await page.click('div:has-text("Convive 1") >> button:has-text("Choisir un plat")');
  await page.click('span:has-text("Steak Frites")');
  
  await page.click('div:has-text("Convive 1") >> button:has-text("Choisir un dessert")');
  await page.click('span:has-text("Cr\u00e8me br\u00fbl\u00e9e")');
  
  // ... continuerait vers Stripe
});
