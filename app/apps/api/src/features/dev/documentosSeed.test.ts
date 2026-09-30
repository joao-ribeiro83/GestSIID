import { describe, expect, it } from 'vitest';
import { memoryDocumentosRepo } from '../documentos/repo.ts';
import { PRESETS } from '../../resources-server/documentos.ts';
import { documentosSeed } from './documentosSeed.ts';

// The dev fixture must let Step 7.3's e2e reach every preset, colour, group and tab.

const ctx = { user: { username: 'DEV', role: 'ADM' as const } };
const q = (over = {}) => ({ filters: {}, sort: [], page: 1, size: 500, ...over });

describe('documentosSeed', () => {
  const seed = documentosSeed();
  const repo = memoryDocumentosRepo(seed);

  it('has a few hundred documents, deterministic', () => {
    expect(seed.documentos.length).toBeGreaterThanOrEqual(200);
    expect(documentosSeed()).toEqual(seed);
  });

  it('every preset finds documents', async () => {
    for (const preset of Object.keys(PRESETS))
      expect((await repo.list(q({ preset }), ctx)).total, preset).toBeGreaterThan(0);
  });

  it('has OFFLINE and ANULADO rows and commented rows', async () => {
    const { rows } = await repo.list(q(), ctx);
    for (const cor of ['OFFLINE', 'ANULADO']) expect(rows.some((r) => r['COR'] === cor), cor).toBe(true);
    expect(rows.some((r) => r['COMENTARIO'] === '***')).toBe(true);
  });

  it('parameter search, both Mostrar grupo branches and every tab have data', async () => {
    const p = seed.parametros?.[0];
    expect(p).toBeDefined();
    const byParam = await repo.list(q({ params: [{ nome: String(p?.['NOME']), valor: String(p?.['VALOR']) }] }), ctx);
    expect(byParam.total).toBeGreaterThan(0);

    const loteDoc = seed.documentos.find((d) => d['MODELO_ID'] === 'R3.D25' && d['LOTE_ID'] != null);
    expect((await repo.list(q({ grupo: String(loteDoc?.['ID']) }), ctx)).total).toBeGreaterThan(1);
    const anexo = seed.anexos?.[0];
    expect((await repo.list(q({ grupo: String(anexo?.['ANEXODOC_ID']) }), ctx)).total).toBeGreaterThan(1);

    for (const tab of ['parametros', 'comentarios', 'anexos', 'fila', 'erros'] as const) {
      const table = { parametros: seed.parametros, comentarios: seed.comentarios, anexos: seed.anexos, fila: seed.fila, erros: seed.erros }[tab] ?? [];
      const id = Number(table[0]?.['DOCUMENTO_ID']);
      expect((await repo.tab(tab, id, ctx.user)).length, tab).toBeGreaterThan(0);
    }
  });
});
