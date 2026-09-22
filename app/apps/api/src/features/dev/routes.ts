import type { FastifyInstance } from 'fastify';
import { DEMO_DOMINIOS, demoImpressoras, demoTabuleiros } from '@gestsiid/shared';
import { auditHooks, crudRoutes, type Row } from '../../lib/crud.ts';
import { memoryStore } from './memoryStore.ts';

/**
 * `/dev/datablock` backend: the demo resources over in-memory stores, plus the domain values
 * the selects read. Registered only by `dev-server.ts` (never by `server.ts`). Every request
 * runs as the ADM user `DEV`, so the demo needs no login.
 */

const DOMINIOS: Record<string, { CHAVE: string; DESIGNACAO: string }[]> = {
  [DEMO_DOMINIOS.tipo]: [
    { CHAVE: 'LASER', DESIGNACAO: 'Laser' },
    { CHAVE: 'JACTO', DESIGNACAO: 'Jacto de tinta' },
    { CHAVE: 'MATRICIAL', DESIGNACAO: 'Matricial' },
    { CHAVE: 'TERMICA', DESIGNACAO: 'Térmica' },
  ],
  [DEMO_DOMINIOS.midia]: [
    { CHAVE: 'A4', DESIGNACAO: 'A4' },
    { CHAVE: 'A3', DESIGNACAO: 'A3' },
    { CHAVE: 'ETIQ', DESIGNACAO: 'Etiquetas' },
    { CHAVE: 'ENV', DESIGNACAO: 'Envelopes' },
  ],
};

const MARCAS = [
  'HP LaserJet',
  'Xerox VersaLink',
  'Kyocera Ecosys',
  'Epson WorkForce',
  'Zebra ZT',
  'Lexmark MS',
  'Brother HL',
];
const TIPOS = ['LASER', 'LASER', 'JACTO', 'MATRICIAL', 'TERMICA', 'LASER', null];
const PISOS = ['Piso 0', 'Piso 1', 'Piso 2', 'Armazém', 'Recepção'];

function seedImpressoras(): Row[] {
  return Array.from({ length: 137 }, (_, i) => {
    const n = i + 1;
    const day = String((n % 28) + 1).padStart(2, '0');
    const month = String((n % 12) + 1).padStart(2, '0');
    return {
      ID: n,
      NOME: `${MARCAS[n % MARCAS.length]} ${400 + ((n * 37) % 500)} — ${PISOS[n % PISOS.length]}`,
      CODIGO: `IMP${String(n).padStart(4, '0')}`,
      TIPO: TIPOS[n % TIPOS.length] ?? null,
      PAGINAS_MIN: n % 9 === 0 ? null : 20 + ((n * 13) % 60),
      DATA_INICIO: `${2020 + (n % 7)}-${month}-${day}T00:00:00`,
      CRIADO_POR: 'MIGRACAO',
      DATA_CRIACAO: `2019-12-${day}T09:30:00`,
      ACTUALIZADO_POR: null,
      DATA_ACTUALIZACAO: null,
    };
  });
}

function seedTabuleiros(): Row[] {
  const rows: Row[] = [];
  const midias = ['A4', 'A3', 'ETIQ', 'ENV', null];
  for (let imp = 1; imp <= 137; imp++) {
    for (let t = 1; t <= (imp % 4) + 1; t++) {
      rows.push({
        ID: rows.length + 1,
        IMPRESSORA_ID: imp,
        TABULEIRO: t,
        MIDIA: midias[(imp + t) % midias.length] ?? null,
        DESCRICAO: t === 1 ? 'Tabuleiro principal' : `Tabuleiro ${t}`,
      });
    }
  }
  return rows;
}

export async function registerDevRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request) => {
    const session = request.session as { user?: unknown } | undefined;
    if (session && !session.user)
      session.user = { username: 'DEV', nome: 'Utilizador de demonstração', role: 'ADM' };
  });

  app.get('/api/dominios/:dominioId/valores', async (request) => ({
    rows: DOMINIOS[(request.params as { dominioId: string }).dominioId] ?? [],
  }));

  crudRoutes(app, demoImpressoras, {
    store: memoryStore(demoImpressoras, seedImpressoras(), { autoId: 'ID' }),
    hooks: auditHooks,
  });
  crudRoutes(app, demoTabuleiros, {
    store: memoryStore(demoTabuleiros, seedTabuleiros(), { autoId: 'ID' }),
    path: '/api/demo-impressoras/:IMPRESSORA_ID/tabuleiros',
  });
}
