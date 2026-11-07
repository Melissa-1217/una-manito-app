import { test, expect } from '@playwright/test';

test('separa participantes aceptados de mensajes privados y respeta el último cupo', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('una-manito-demo-v1', JSON.stringify({
    publicaciones: [{ id: 'evento', autor_id: 'luis', tipo: 'solicitud', titulo: 'Ayuda para mover las mesas', descripcion: 'Necesito dos personas para mover las mesas del local.', categoria: 'Otros', barrio: 'Barrio Demo', estado: 'en_coordinacion', cupos: 2 }],
    ofrecimientos: [
      { id: 'a', publicacion_id: 'evento', vecino_id: 'ana', mensaje: 'Mensaje privado de Ana.', estado: 'pendiente' },
      { id: 'm', publicacion_id: 'evento', vecino_id: 'maria', perfiles: { nombre: 'María' }, mensaje: 'Mensaje privado de María.', estado: 'aceptado' },
      { id: 'p', publicacion_id: 'evento', vecino_id: 'pedro', perfiles: { nombre: 'Pedro' }, mensaje: 'Mensaje privado de Pedro.', estado: 'pendiente' },
    ],
  })));
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  const open = () => page.getByRole('button').filter({ has: page.getByRole('heading', { name: 'Ayuda para mover las mesas', exact: true }) }).click();
  await open();
  const participants = page.getByRole('region', { name: 'Participantes confirmados' });
  await expect(participants.getByRole('listitem')).toHaveText(['María']);
  await expect(participants).toContainText('1 de 2 cupos ocupados');
  await expect(page.getByText('Mensaje privado de Ana.', { exact: true })).toBeVisible();
  await expect(page.getByText('Mensaje privado de María.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Mensaje privado de Pedro.', { exact: true })).toHaveCount(0);
  await page.getByLabel('Cambiar usuario de demostración').selectOption('luis');
  await open();
  await expect(page.getByText('Mensaje privado de Pedro.', { exact: true })).toBeVisible();
  await page.locator('.offer').filter({ hasText: 'Mensaje privado de Ana.' }).getByRole('button', { name: 'Aceptar ayuda' }).click();
  await expect(participants.getByRole('listitem')).toHaveText(['Ana', 'María']);
  await expect(participants).toContainText('Cupos completos');
  await expect(page.locator('.offer').filter({ hasText: 'Mensaje privado de Pedro.' }).getByRole('button', { name: 'Aceptar ayuda' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
