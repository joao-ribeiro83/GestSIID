import { expect, test } from '@playwright/test';

// Configuração › Modelos, section image (Step 6.2): PUT | GET | DELETE
// /api/modelos/:MODELO_ID/seccoes/:TIPOSEC_ID/:ALINEA/imagem through the browser's session,
// against the dev server's in-memory stores, never Oracle (CLAUDE.md HARD RULE). The screen comes
// in Step 6.3, so this drives the API with the page's cookies and CSRF token.

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const URL = '/api/modelos/MOD1/seccoes/CORPO/2/imagem';

test.use({ storageState: 'e2e/.auth/adm.json' });

test('uploads a section image and downloads it back byte-identical, then removes it', async ({ request }) => {
  const { csrf } = (await (await request.get('/api/auth/me')).json()) as { csrf: string };
  const headers = { 'x-csrf-token': csrf };

  const up = await request.put(URL, {
    headers,
    multipart: { ficheiro: { name: 'assinatura.png', mimeType: 'image/png', buffer: PNG } },
  });
  expect(up.status()).toBe(204);

  const down = await request.get(URL);
  expect(down.status()).toBe(200);
  expect(down.headers()['content-type']).toBe('image/png');
  expect(down.headers()['x-content-type-options']).toBe('nosniff');
  expect(Buffer.compare(await down.body(), PNG)).toBe(0);

  expect((await request.delete(URL, { headers })).status()).toBe(204);
  expect((await request.get(URL)).status()).toBe(204);
});

test('refuses a file that is not an image (415)', async ({ request }) => {
  const { csrf } = (await (await request.get('/api/auth/me')).json()) as { csrf: string };
  const res = await request.put(URL, {
    headers: { 'x-csrf-token': csrf },
    multipart: { ficheiro: { name: 'a.pdf', mimeType: 'image/png', buffer: Buffer.from('%PDF-1.4') } },
  });
  expect(res.status()).toBe(415);
});
