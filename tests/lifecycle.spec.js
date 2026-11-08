import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';

test('una publicación vence en la pantalla abierta sin necesitar recargar', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T12:00:00Z') });
  await page.addInitScript(() => localStorage.setItem('una-manito-demo-v1', JSON.stringify({
    publicaciones: [{ id: 'deadline', autor_id: 'ana', tipo: 'solicitud', titulo: 'Solicitud cerca de su vencimiento', descripcion: 'Necesito ayuda para esta tarea del barrio.', categoria: 'Otros', barrio: 'Barrio Demo', estado: 'pendiente', cupos: 1, creado_en: '2026-10-31T12:00:10Z', vence_en: '2026-11-07T12:00:10Z' }], ofrecimientos: [],
  })));
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitud cerca de su vencimiento' })).toBeVisible();
  await page.clock.fastForward(31000);
  await expect(page.getByRole('heading', { name: 'Solicitud cerca de su vencimiento' })).toHaveCount(0);
  await navigateTo(page, 'Mi actividad');
  await page.getByRole('button', { name: 'Historial', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Solicitud cerca de su vencimiento' })).toBeVisible();
  await expect(page.getByText('Vencida', { exact: true })).toBeVisible();
});

test('historial permite renovar y cancelar sin perder respuestas ni publicaciones', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const base = { autor_id: 'ana', tipo: 'solicitud', descripcion: 'Necesito ayuda de mis vecinos para esta tarea.', categoria: 'Otros', barrio: 'Barrio Demo', cupos: 1, creado_en: new Date(Date.now() - 8 * 86400000).toISOString(), vence_en: new Date(Date.now() - 86400000).toISOString() };
    localStorage.setItem('una-manito-demo-v1', JSON.stringify({ publicaciones: [
      { ...base, id: 'expired', titulo: 'Solicitud antigua sin respuestas', estado: 'pendiente' },
      { ...base, id: 'coordinating', titulo: 'Ayuda que seguimos coordinando', estado: 'en_coordinacion', primera_respuesta_en: base.creado_en },
      { ...base, id: 'resolved', titulo: 'Ayuda resuelta con valoración', estado: 'resuelta' },
    ], ofrecimientos: [{ id: 'o', publicacion_id: 'resolved', vecino_id: 'luis', mensaje: 'Mensaje de la ayuda anterior.', estado: 'aceptado', recomendado: true }] }));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitud antigua sin respuestas' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ayuda resuelta con valoración' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ayuda que seguimos coordinando' })).toBeVisible();
  await navigateTo(page, 'Mi actividad');
  await page.getByRole('button', { name: 'Historial', exact: true }).click();
  const open = title => page.getByRole('button').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).click();
  await open('Ayuda resuelta con valoración');
  await expect(page.getByText('Mensaje de la ayuda anterior.', { exact: true })).toBeVisible();
  await expect(page.getByText('Diste tu visto bueno', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar publicación' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await open('Solicitud antigua sin respuestas');
  await expect(page.getByRole('button', { name: 'Marcar como resuelta' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Renovar por 7 días' }).click();
  await expect(page.getByText('Publicación renovada por 7 días.', { exact: true })).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar publicación' }).click();
  await page.getByLabel('Motivo de cancelación').fill('Ya no necesito esta ayuda.');
  await page.getByRole('button', { name: 'Confirmar cancelación' }).click();
  await expect(page.getByText('Cancelada', { exact: true })).toBeVisible();
  await expect(page.getByText('Motivo: Ya no necesito esta ayuda.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Solicitud antigua sin respuestas' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `../una-manito-historial-${testInfo.project.name}.png`, fullPage: true });
});
