export async function navigateTo(page, label) {
  const profileActions = ['Mi perfil', 'Mi actividad', 'Cambiar barrio', 'Ver bienvenida', 'Cerrar sesión'];
  const inProfile = profileActions.includes(label);
  await page.getByRole('button', { name: inProfile ? 'Abrir perfil' : 'Abrir menú', exact: true }).click();
  const panel = page.getByRole('dialog', { name: inProfile ? 'Perfil' : 'Menú', exact: true });
  await panel.getByRole('button', { name: label, exact: true }).click();
}

export async function openTutorial(page) {
  await page.getByRole('button', { name: 'Chat con Manolito', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cómo usar la app', exact: true }).click();
}
