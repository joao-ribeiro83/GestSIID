import type { FastifyInstance } from 'fastify';
import {
  DEMO_DOMINIOS,
  demoImpressoras,
  demoTabuleiros,
  dominios,
  DOMINIOS_DOMINIOS,
  dominiosValores,
  impressoras,
  IMPRESSORAS_DOMINIOS,
} from '@gestsiid/shared';
import { auditHooks, crudRoutes, type CrudHooks, type Row } from '../../lib/crud.ts';
import { registerDominiosCrudRoutes } from '../dominios/routes.ts';
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
  // Real CFG_VALORES_DOMINIO rows (analysis/db/tables/CFG_VALORES_DOMINIO.md), ordered by PRIORIDADE.
  [IMPRESSORAS_DOMINIOS.gsdevice]: [
    { CHAVE: 'PXLCOLOR', DESIGNACAO: 'HP color PCL XL printers' },
    { CHAVE: 'PXLMONO', DESIGNACAO: 'HP black-and-white PCL XL printers' },
    { CHAVE: 'PDF', DESIGNACAO: 'Sem device' },
    { CHAVE: 'LJET4', DESIGNACAO: 'HP LaserJet 4' },
    { CHAVE: 'LASERJET', DESIGNACAO: 'HP LaserJet' },
  ],
  [IMPRESSORAS_DOMINIOS.valido]: [
    { CHAVE: 'N', DESIGNACAO: 'Não' },
    { CHAVE: 'S', DESIGNACAO: 'Sim' },
  ],
  // Domains-of-domains (CFG_VALORES_DOMINIO.md): the selects FD_DOMINIOS_SIID itself feeds.
  [DOMINIOS_DOMINIOS.tipoInformacao]: [
    { CHAVE: 'DATA', DESIGNACAO: 'Data' },
    { CHAVE: 'NUMBER', DESIGNACAO: 'Numérico' },
    { CHAVE: 'STRING', DESIGNACAO: 'String' },
  ],
  [DOMINIOS_DOMINIOS.tipoDominio]: [
    { CHAVE: 'I', DESIGNACAO: 'Intervalo Valores' },
    { CHAVE: 'L', DESIGNACAO: 'Lista Valores' },
  ],
  [DOMINIOS_DOMINIOS.tipoString]: [
    { CHAVE: 'A', DESIGNACAO: 'Alfanumérica' },
    { CHAVE: 'C', DESIGNACAO: 'Caracteres' },
    { CHAVE: 'N', DESIGNACAO: 'Numérica' },
  ],
  [DOMINIOS_DOMINIOS.formatacaoString]: [
    { CHAVE: 'M', DESIGNACAO: 'Maiúsculo' },
    { CHAVE: 'N', DESIGNACAO: 'Minúsculo' },
    { CHAVE: 'X', DESIGNACAO: 'Misto' },
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

// Small, fixed seed for the real Impressoras screen's e2e coverage (distinct from the 137-row
// demoImpressoras data above, which only backs /dev/datablock). ID is text (SVR_IMPRESSORAS.ID is
// VARCHAR2, populated by ID_IMPRESSORA_SEQ in production) — unlike demoImpressoras.ID, which is a
// fictional numeric column, so `memoryStore`'s numeric `autoId` cannot be reused here.
function seedImpressorasReal(): Row[] {
  const gsdevices = ['PXLCOLOR', 'PXLMONO', 'LJET4', 'LASERJET', 'PDF'];
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return {
      ID: String(n),
      DESCRICAO: `Impressora ${n}`,
      ENDERECO: `10.0.0.${n}`,
      SERVIDOR: `PRINT${String(n).padStart(2, '0')}`,
      VALIDO: n % 5 === 0 ? 'N' : 'S',
      GSDEVICE_RF: gsdevices[n % gsdevices.length],
      CRIADO_POR: 'MIGRACAO',
      DATA_CRIACAO: '2019-12-01T09:30:00',
      ACTUALIZADO_POR: null,
      DATA_ACTUALIZACAO: null,
    };
  });
}

const audit = {
  CRIADO_POR: 'DISCOSECFOR',
  DATA_CRIACAO: '2010-02-15T12:52:27',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
};

// Step 4.6: the real CFG_DOMINIOS / CFG_VALORES_DOMINIO rows the app itself relies on
// (analysis/db/tables/*.md), for the /administracao/dominios master-detail e2e specs.
function seedDominios(): Row[] {
  const d = (ID: string, DESCRICAO: string, over: Record<string, unknown> = {}) => ({
    ID,
    DESCRICAO,
    TIPO_INFORMACAO_RF: 'STRING',
    TIPO_DOMINIO_RF: 'L',
    TIPO_STRING_RF: 'A',
    FORMATACAO_STRING_RF: 'M',
    TAMANHO_MAXIMO: null,
    PRECISAO: null,
    VALOR_MINIMO: null,
    VALOR_MAXIMO: null,
    DOMINIO_SISTEMA_BN: 'S',
    VALOR_COMUM: null,
    OBSERVACAO: null,
    ESTADO_REGISTO_RF: 'N',
    DATA_ESTADO: '2010-02-15T00:00:00',
    REGISTADO_POR: audit.CRIADO_POR,
    DATA_REGISTO: audit.DATA_CRIACAO,
    ACTUALIZADO_POR: audit.ACTUALIZADO_POR,
    DATA_ACTUALIZACAO: audit.DATA_ACTUALIZACAO,
    ...over,
  });
  return [
    d('BINARIO', 'Valores binários (Sim/Não)'),
    d('TIPO_INFORMACAO', 'Tipo de informação de um domínio'),
    d('TIPO_DOMINIO', 'Tipo de domínio (lista ou intervalo)'),
    d('TIPO_STRING', 'Tipo de string de um domínio', { TIPO_DOMINIO_RF: 'I', VALOR_MINIMO: 'A', VALOR_MAXIMO: 'N' }),
    d('FORMATACAO_STRING', 'Formatação de uma string'),
    d('NIVEL_ACESSO', 'Nível de acesso (numérico, sem valores)', { TIPO_INFORMACAO_RF: 'NUMBER' }),
  ];
}

function seedDominiosValores(): Row[] {
  const v = (DOMINIO_ID: string, CHAVE: string, DESIGNACAO: string, PRIORIDADE: number) => ({
    DOMINIO_ID,
    CHAVE,
    DESIGNACAO,
    DESCRICAO: DESIGNACAO,
    DATA_INICIO: '2010-02-15T00:00:00',
    DATA_FIM: null,
    PRIORIDADE,
    REGISTADO_POR: audit.CRIADO_POR,
    DATA_REGISTO: audit.DATA_CRIACAO,
    ACTUALIZADO_POR: audit.ACTUALIZADO_POR,
    DATA_ACTUALIZACAO: audit.DATA_ACTUALIZACAO,
  });
  return [
    v('BINARIO', 'N', 'Não', 0),
    v('BINARIO', 'S', 'Sim', 1),
    v('TIPO_INFORMACAO', 'DATA', 'Data', 0),
    v('TIPO_INFORMACAO', 'NUMBER', 'Numérico', 1),
    v('TIPO_INFORMACAO', 'STRING', 'String', 2),
    v('TIPO_DOMINIO', 'I', 'Intervalo Valores', 0),
    v('TIPO_DOMINIO', 'L', 'Lista Valores', 1),
    v('TIPO_STRING', 'A', 'Alfanumérica', 0),
    v('TIPO_STRING', 'C', 'Caracteres', 1),
    v('TIPO_STRING', 'N', 'Numérica', 2),
    v('FORMATACAO_STRING', 'M', 'Maiúsculo', 0),
    v('FORMATACAO_STRING', 'N', 'Minúsculo', 1),
    v('FORMATACAO_STRING', 'X', 'Misto', 2),
  ];
}

/** Dev stand-in for `impressorasHooks` (routes.ts): a plain string counter instead of
 * `ID_IMPRESSORA_SEQ.NEXTVAL`, since `memoryStore` has no Oracle sequence to call. */
function devImpressorasHooks(seedCount: number): CrudHooks {
  let next = seedCount + 1;
  return {
    beforeInsert: (v, ctx) => ({ ...auditHooks.beforeInsert!(v, ctx), ID: String(next++) }),
    beforeUpdate: auditHooks.beforeUpdate,
  };
}

export async function registerDevRoutes(
  app: FastifyInstance,
  opts: { autoLogin?: boolean } = {},
): Promise<void> {
  // Step 3.2: once a real `authRepo` is wired in, login is real and must not be forged here.
  if (opts.autoLogin ?? true) {
    app.addHook('onRequest', async (request) => {
      const session = request.session as { user?: unknown } | undefined;
      if (session && !session.user)
        session.user = { username: 'DEV', nome: 'Utilizador de demonstração', role: 'ADM' };
    });
  }

  app.get('/api/dominios/:dominioId/valores', async (request) => ({
    rows: DOMINIOS[(request.params as { dominioId: string }).dominioId] ?? [],
  }));

  crudRoutes(app, demoImpressoras, {
    store: memoryStore(demoImpressoras, seedImpressoras(), { autoId: 'ID' }),
    hooks: auditHooks,
  });
  // The real Impressoras resource (Step 4.1): in memory here too, so Playwright can drive
  // /configuracao/impressoras without Oracle (CLAUDE.md HARD RULE — writes are never real here).
  const seedReal = seedImpressorasReal();
  crudRoutes(app, impressoras, {
    store: memoryStore(impressoras, seedReal),
    hooks: devImpressorasHooks(seedReal.length),
  });
  crudRoutes(app, demoTabuleiros, {
    store: memoryStore(demoTabuleiros, seedTabuleiros(), { autoId: 'ID' }),
    path: '/api/demo-impressoras/:IMPRESSORA_ID/tabuleiros',
  });
  // Step 4.6: Domínios, the first master-detail screen (same route code as production).
  registerDominiosCrudRoutes(app, {
    store: memoryStore(dominios, seedDominios()),
    valoresStore: memoryStore(dominiosValores, seedDominiosValores()),
  });
}
