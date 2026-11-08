export async function navigateTo(page, label) {
  const visible = page.getByRole('button', { name: label, exact: true }).filter({ visible: true });
  if (!await visible.count()) await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.getByRole('button', { name: label, exact: true }).filter({ visible: true }).first().click();
}
