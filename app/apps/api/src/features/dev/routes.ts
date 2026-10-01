import type { FastifyInstance } from 'fastify';
import {
  DEMO_DOMINIOS,
  demoImpressoras,
  demoTabuleiros,
  dominios,
  DOMINIOS_DOMINIOS,
  dominiosValores,
  empregadosLov,
  funcoesDepartamento,
  impressoras,
  impressorasAssociadasDoc,
  impressorasAssociadasUsr,
  IMPRESSORAS_DOMINIOS,
  modelos,
  modelosAtributosArquivo,
  modelosAtributosEdoc,
  modelosCondicoes,
  MODELOS_DOMINIOS,
  modelosLov,
  modelosParametrosOmissao,
  modelosSeccoes,
  perfisDepartamento,
  permissoes,
  PERMISSOES_DOMINIOS,
  reportParametros,
  reports,
  REPORTS_DOMINIOS,
  tiposMidia,
  unidadesMedida,
  utilizadores,
  utilizadoresLov,
  UTILIZADORES_DOMINIOS,
  variaveis,
  VARIAVEIS_DOMINIOS,
} from '@gestsiid/shared';
import { auditHooks, crudRoutes, type CrudHooks, type CrudStore, type Row } from '../../lib/crud.ts';
import { memoryDocumentosRepo } from '../documentos/repo.ts';
import { registerDocumentosRoutes } from '../documentos/routes.ts';
import { memoryOperacoesDb } from '../documentos/operacoes/memoria.ts';
import { registerOperacoesRoutes } from '../documentos/operacoes/routes.ts';
import { registerDominiosCrudRoutes } from '../dominios/routes.ts';
import { registerImpressorasAssociadasRoutes } from '../impressoras-associadas/routes.ts';
import { memoryModelosRepo, type ModelosStores } from '../modelos/repo.ts';
import { registerModelosRoutes } from '../modelos/routes.ts';
import { memoryPerfisRepo } from '../perfis-departamento/repo.ts';
import { registerPerfisDepartamentoRoutes } from '../perfis-departamento/routes.ts';
import { localNow, memoryPermissoesRepo } from '../permissoes/repo.ts';
import { registerPermissoesRoutes } from '../permissoes/routes.ts';
import { FIM_BULK, validaHoje, type Modelo, type Perm, type Utilizador } from '../permissoes/rules.ts';
import { registerReportsCrudRoutes } from '../reports/routes.ts';
import { registerTiposMidiaRoutes } from '../tipos-midia/routes.ts';
import { registerUnidadesMedidaRoutes } from '../unidades-medida/routes.ts';
import { registerUtilizadoresRoutes } from '../utilizadores/routes.ts';
import { memoryBackupsRepo } from '../backups/memoria.ts';
import { registerBackupsRoutes } from '../backups/routes.ts';
import { registerVariaveisRoutes } from '../variaveis/routes.ts';
import { documentosSeed } from './documentosSeed.ts';
import { memoryImageStore } from './memoryImageStore.ts';
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
  // Real domain rows (CFG_VALORES_DOMINIO.md); UNIDADE_NEGOCIO shows only the form's own default.
  [UTILIZADORES_DOMINIOS.tipo]: [{ CHAVE: 'ADM', DESIGNACAO: 'ADMINISTRADOR' }],
  [UTILIZADORES_DOMINIOS.unidadeNegocio]: [
    { CHAVE: 'DFI', DESIGNACAO: 'DFI' },
    { CHAVE: 'DSI', DESIGNACAO: 'DSI' },
  ],
  // Real TIPO_PERMISSAO rows (CFG_VALORES_DOMINIO.md), for the Permissões panels.
  [PERMISSOES_DOMINIOS.tipo]: [
    { CHAVE: '0', DESIGNACAO: 'GERAR DOCUMENTO' },
    { CHAVE: '1', DESIGNACAO: 'IMPRIMIR DOCUMENTO' },
    { CHAVE: '2', DESIGNACAO: 'IMPRIMIR CÓPIA' },
    { CHAVE: '3', DESIGNACAO: 'IMPRIMIR 2ª VIA' },
    { CHAVE: '4', DESIGNACAO: 'VISUALIZAR' },
    { CHAVE: '5', DESIGNACAO: 'ENVIAR POR MAIL' },
    { CHAVE: '6', DESIGNACAO: 'IMPRIMIR PDF' },
    { CHAVE: '7', DESIGNACAO: 'GUARDAR PDF' },
    { CHAVE: '8', DESIGNACAO: 'GUARDAR 2ªs Vias' },
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
  // Real CFG_VALORES_DOMINIO rows (analysis/db/tables/CFG_VALORES_DOMINIO.md), for the Reports
  // screen's Tipo de Parâmetro select.
  [REPORTS_DOMINIOS.tipoParametro]: [
    { CHAVE: '1', DESIGNACAO: 'PARAMETROS DESTINADOS AO REPORT' },
    { CHAVE: '2', DESIGNACAO: 'PARAMETROS DESTINADOS AO SIID' },
    { CHAVE: '3', DESIGNACAO: 'PARAMETROS PASSADOS POR BD' },
  ],
  // Modelos selects: CODIGOS BARRAS rows are real (CFG_VALORES_DOMINIO.md); the MODO_* rows are
  // the meanings DECISIONS D-23 lists (the domain rows are not in the analysis dump).
  [MODELOS_DOMINIOS.modoExpedicao]: [
    { CHAVE: 'I', DESIGNACAO: 'Impresso' },
    { CHAVE: 'E', DESIGNACAO: 'Email' },
    { CHAVE: 'M', DESIGNACAO: 'Impresso e email' },
    { CHAVE: 'A', DESIGNACAO: 'eDocLink alteração' },
    { CHAVE: 'G', DESIGNACAO: 'eDocLink garantia' },
    { CHAVE: 'W', DESIGNACAO: 'eDoc API' },
  ],
  [MODELOS_DOMINIOS.modoCertificado]: [
    { CHAVE: '0', DESIGNACAO: 'Isento' },
    { CHAVE: '1', DESIGNACAO: 'Assinado' },
    { CHAVE: '2', DESIGNACAO: 'Selado' },
  ],
  [MODELOS_DOMINIOS.modoProtecao]: [
    { CHAVE: '0', DESIGNACAO: 'Sem proteção' },
    { CHAVE: '1', DESIGNACAO: 'Marca de água' },
  ],
  [MODELOS_DOMINIOS.codigosBarras]: [
    { CHAVE: 'AZTEC', DESIGNACAO: 'AZTEC' },
    { CHAVE: 'CODE_128', DESIGNACAO: 'CODE_128' },
    { CHAVE: 'CODE_39', DESIGNACAO: 'CODE_39' },
    { CHAVE: 'DATA_MATRIX', DESIGNACAO: 'DATA_MATRIX' },
    { CHAVE: 'QRCODE_H', DESIGNACAO: 'QRCODE EC=H' },
  ],
  // The variable names seen in SVR_VARIAVEIS_SIID (the domain's own rows are not in the analysis).
  [VARIAVEIS_DOMINIOS.tipo]: [
    { CHAVE: 'BACKUP', DESIGNACAO: 'Destino dos backups' },
    { CHAVE: 'GS', DESIGNACAO: 'Ghostscript' },
    { CHAVE: 'LIMITE_NOTIF', DESIGNACAO: 'Limite de notificações' },
    { CHAVE: 'ONLINE', DESIGNACAO: 'Unidade online' },
    { CHAVE: 'PDF', DESIGNACAO: 'Pasta dos PDF' },
    { CHAVE: 'PERIODO_GRACA', DESIGNACAO: 'Período de graça' },
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

// Step 4.8: the real SVR_REPORT_SIID / SVR_PARAMETROS_REPORT rows (analysis/db/tables/*.md), for
// the /configuracao/reports master-detail e2e specs. Every report always carries its 3 fixed
// parameters (BR-ADM-05); REPORT_2 also has a 4th so N_PARAMETROS-mismatch can be exercised.
function seedReports(): Row[] {
  const r = (ID: number, NOME: string, N_PARAMETROS: number) => ({
    ID,
    NOME,
    N_PARAMETROS,
    VALIDO: 'S',
    NOME_FICHEIRO: null,
    DIRECTORIA_BASE: null,
    DIRECTORIA_DESTINO: null,
    OBSERVACAO: null,
    ...audit,
  });
  return [r(1, 'Relatório de Impressões', 3), r(2, 'Relatório de Backups', 3)];
}

function seedReportParametros(): Row[] {
  const p = (
    REPORT_ID: number,
    N_PARAMETRO: number,
    NOME: string,
    over: Record<string, unknown> = {},
  ) => ({
    REPORT_ID,
    N_PARAMETRO,
    NOME,
    TIPO_PARAMETRO_RF: '1',
    OBRIGATORIO: 'N',
    CHECK_UNIQUE: 'N',
    VALIDO: 'S',
    DESCRICAO: null,
    ...audit,
    ...over,
  });
  const fixedTrio = (reportId: number) => [
    p(reportId, 1, '_USER', { TIPO_PARAMETRO_RF: '2', OBRIGATORIO: 'S' }),
    p(reportId, 2, 'P_USUARIO', { OBRIGATORIO: 'S' }),
    p(reportId, 3, 'P_DATAACTUAL'),
  ];
  return [
    ...fixedTrio(1),
    ...fixedTrio(2),
    p(2, 4, 'P_TIPO_BACKUP', { DESCRICAO: 'Tipo de backup a listar' }),
  ];
}

// Step 5.0: FD_GESTAO_IMPRESSORAS_DOC / FD_GESTAO_IMPRESSORAS_USR, over the same 12 printers as
// seedImpressorasReal (analysis/db/tables/DOC_IMPRESSORAS_DOC.md, DOC_IMPRESSOES_MODELO_USR.md).
// MOD3 / USER3 start empty, for the e2e "Nova"/"Copiar" flows to have somewhere to land.
function seedModelosLov(): Row[] {
  return [{ ID: 'MOD1' }, { ID: 'MOD2' }, { ID: 'MOD3' }, { ID: 'MOD4' }];
}

function seedUtilizadoresLov(): Row[] {
  return [{ CDIDUSR: 'USER1' }, { CDIDUSR: 'USER2' }, { CDIDUSR: 'USER3' }, { CDIDUSR: 'USER4' }];
}

function seedImpressorasAssociadasDoc(): Row[] {
  const r = (over: Record<string, unknown>) => ({
    MODELO_ID: 'MOD1',
    AMBIENTE_ID: DEV_AMBIENTE,
    IMPRESSORA_ID: '1',
    DATA_INICIO: '2020-01-01T00:00:00',
    DATA_FIM: '2020-06-30T00:00:00',
    ...audit,
    ...over,
  });
  return [
    r({}),
    r({ IMPRESSORA_ID: '2', DATA_INICIO: '2020-07-01T00:00:00', DATA_FIM: null }),
    r({ MODELO_ID: 'MOD2', IMPRESSORA_ID: '3', DATA_INICIO: '2019-01-01T00:00:00', DATA_FIM: '2019-12-31T00:00:00' }),
  ];
}

function seedImpressorasAssociadasUsr(): Row[] {
  const r = (over: Record<string, unknown>) => ({
    MODELO_ID: 'MOD1',
    CDEMPLEA: 'USER1',
    IMPRESSORA_ID: '1',
    DATA_INICIO: '2020-01-01T00:00:00',
    DATA_FIM: '2020-06-30T00:00:00',
    ...audit,
    ...over,
  });
  return [
    r({}),
    r({ IMPRESSORA_ID: '2', DATA_INICIO: '2020-07-01T00:00:00', DATA_FIM: null }),
    // Unexpired, open-ended: the source row for the "Copiar do modelo"/"Copiar do utilizador" specs.
    r({ MODELO_ID: 'MOD2', CDEMPLEA: 'USER2', IMPRESSORA_ID: '4', DATA_INICIO: '2021-01-01T00:00:00', DATA_FIM: null }),
  ];
}

const DEV_AMBIENTE = 'DEV';

// The real CFG_UNIDADES_MEDIDA / CFG_TIPOS_MIDIA rows (analysis/db/tables/*.md), for the Step 4.2
// e2e specs. Same route code as production; only the store is in memory.
const audit = {
  CRIADO_POR: 'DISCOSECFOR',
  DATA_CRIACAO: '2010-02-15T12:52:27',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
};

function seedUnidades(): Row[] {
  const u = (ID: string, NOME: string, FACTOR: number, UNIDADE_BASE_ID: string | null) => ({
    ID,
    NOME,
    FACTOR,
    UNIDADE_BASE_ID,
    GEN_MEDIDA_RF: 'DIGITAL',
    ...audit,
  });
  return [
    u('BYTES', 'Bytes', 1, null),
    u('KB', 'Kilobytes', 1e3, 'BYTES'),
    u('KIB', 'Kibibytes', 1024, 'BYTES'),
    u('MB', 'Megabytes', 1e6, 'BYTES'),
    u('MIB', 'Mebibytes', 1048576, 'BYTES'),
    u('GB', 'Gigabytes', 1e9, 'BYTES'),
    u('GIB', 'Gibibytes', 1073741824, 'BYTES'),
    u('TB', 'Terabytes', 1e12, 'BYTES'),
    u('TIB', 'Tebibytes', 1099511627776, 'BYTES'),
    u('PB', 'Petabytes', 1e15, 'BYTES'),
    u('PIB', 'Pebibytes', 1125899906842624, 'BYTES'),
  ];
}

function seedUtilizadores(): Row[] {
  const u = (USERNAME: string, NOME: string, DATA_FIM: string | null) => ({
    USERNAME,
    NOME,
    AMBIENTE_ID: DEV_AMBIENTE,
    UNIDADE_NEGOCIO_RF: 'DSI',
    TIPO_UTILIZADOR_RF: 'ADM',
    DATA_INICIO: '2010-10-07T00:00:00',
    DATA_FIM,
    NIVEL_ACESSO_RF: 0,
    ...audit,
  });
  return [
    u('DEV', 'UTILIZADOR DE DEMONSTRAÇÃO', null),
    u('ANA.SILVA', 'ANA SILVA', '2200-01-01T00:00:00'),
    u('RUI.COSTA', 'RUI COSTA', '2020-12-31T00:00:00'),
  ];
}

// Fake values. The PASSWORD rows and the other environment's row are there to prove the screen
// never shows them.
function seedVariaveis(): Row[] {
  const v = (TIPO_VARIAVEL_RF: string, VALOR: string | null, AMBIENTE_ID = DEV_AMBIENTE) => ({
    AMBIENTE_ID,
    TIPO_VARIAVEL_RF,
    VALOR,
  });
  return [
    v('BACKUP', '\\\\servidor\\documentos\\backup'),
    v('LIMITE_NOTIF', '14'),
    v('ONLINE', 'D:\\'),
    v('PDF', '\\\\servidor\\documentos\\pdf\\'),
    v('PERIODO_GRACA', '15'),
    v('PASSWORD', 'HASH-SECRETO'),
    v('PASSWORD_OLD', 'HASH-ANTIGO'),
    v('SLB', 'de outro ambiente', 'OUTRO'),
  ];
}

function seedTiposMidia(): Row[] {
  const t = (ID: string, DESIGNACAO: string, TAMANHO_MIDIA: number) => ({
    ID,
    DESIGNACAO,
    DESCRICAO: null,
    GEN_MEDIDA_RF: 'DIGITAL',
    UNIDADE_MEDIDA_ID: 'GB',
    TAMANHO_MIDIA,
    TAMANHO_BYTES: Math.round(TAMANHO_MIDIA * 1e9),
    ...audit,
  });
  return [
    t('DVD+R47G', 'DVD+R 4,7 Gb', 4.7),
    t('DVD+R85G', 'DVD+R DL 8,54 Gb', 8.54),
    t('DVD-R47G', 'DVD-R 4,7 Gb', 4.7),
    t('DVD-R85G', 'DVD-R DL 8,54 Gb', 8.54),
    t('DVDRAM2G', 'DVD-RAM 2,6 Gb', 2.6),
    t('DVDRAM5G', 'DVD-RAM 5,2 Gb', 5.2),
    t('DVDRAM9G', 'DVD-RAM 9,4 Gb', 9.4),
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
  // Step 4.2: the same route code as production over in-memory stores.
  const unidades = memoryStore(unidadesMedida, seedUnidades());
  registerUnidadesMedidaRoutes(app, { store: unidades });
  registerTiposMidiaRoutes(app, { store: memoryStore(tiposMidia, seedTiposMidia()), unidades });
  // Step 4.3: no PASSWORD is seeded or kept (memoryStore drops write-only columns).
  registerUtilizadoresRoutes(app, {
    store: memoryStore(utilizadores, seedUtilizadores()),
    ambiente: DEV_AMBIENTE,
  });
  // Step 4.4: Variáveis SIID, the environment's settings.
  registerVariaveisRoutes(app, {
    store: memoryStore(variaveis, seedVariaveis()),
    ambiente: DEV_AMBIENTE,
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
  // Step 4.8: Reports, the fixed-parameter / N_PARAMETROS master-detail screen.
  registerReportsCrudRoutes(app, {
    store: memoryStore(reports, seedReports(), { autoId: 'ID' }),
    parametrosStore: memoryStore(reportParametros, seedReportParametros()),
  });
  // Step 5.0: Impressoras Associadas › Documento/Utilizador (dedupeKeys: memoryStore's global
  // tiebreak dedup, gotcha #9 — a copy preserves the source row's DATA_INICIO exactly, which
  // would otherwise falsely 409 against the source row itself).
  registerImpressorasAssociadasRoutes(app, {
    docStore: memoryStore(impressorasAssociadasDoc, seedImpressorasAssociadasDoc(), {
      dedupeKeys: ['MODELO_ID', 'IMPRESSORA_ID'],
    }),
    usrStore: memoryStore(impressorasAssociadasUsr, seedImpressorasAssociadasUsr(), {
      dedupeKeys: ['MODELO_ID', 'CDEMPLEA', 'IMPRESSORA_ID'],
    }),
    modelosStore: memoryStore(modelosLov, seedModelosLov()),
    utilizadoresStore: memoryStore(utilizadoresLov, seedUtilizadoresLov()),
    ambiente: DEV_AMBIENTE,
  });
  // Step 5.3: Permissões. The grid is rebuilt from the repo on every call, so actions show up.
  const permRepo = memoryPermissoesRepo(seedPermissoes());
  registerPermissoesRoutes(app, { store: permissoesVista(permRepo), repo: permRepo });
  // Step 5.5: Perfis de departamento (Gador › Equipa de Gestão), signature in memory.
  const perfisStore = memoryStore(perfisDepartamento, seedPerfis(), { autoId: 'ID' });
  const admCtx = { user: { username: 'DEV', role: 'ADM' as const } };
  registerPerfisDepartamentoRoutes(app, {
    store: perfisStore,
    empregadosStore: memoryStore(empregadosLov, DEV_EMPREGADOS),
    funcoesStore: memoryStore(funcoesDepartamento, DEV_FUNCOES),
    repo: memoryPerfisRepo({
      ttapvaat: DEV_TTAPVAAT,
      funcoes: DEV_FUNCOES,
      usados: async () =>
        new Set(
          (await perfisStore.list({ filters: {}, sort: [], page: 1, size: 1000 }, {}, admCtx)).rows.map(
            (r) => String(r['CODIGO'] ?? ''),
          ),
        ),
    }),
    imageStore: memoryImageStore({
      exists: async (k) =>
        (
          await perfisStore.list(
            { filters: { ID: [{ op: 'eq', value: String(k['id']) }] }, sort: [], page: 1, size: 1 },
            {},
            admCtx,
          )
        ).total > 0,
    }),
    maxBytes: 1024 * 1024,
  });
  // Step 6.1: Modelos (Configuração › Modelos). Clonar and the omissão versioning write through
  // the same stores the grid reads.
  // Gestão › Documentos (Step 7.1). No FileServerSIID here: the PDF route answers 502.
  const docsSeed = documentosSeed();
  const docsRepo = memoryDocumentosRepo(docsSeed);
  registerDocumentosRoutes(app, {
    repo: docsRepo,
    fileServer: { baseUrl: 'http://127.0.0.1:9/FileServerSIID/restapi/FileServer/pdf/T', timeoutMs: 1000 },
  });
  // Step 7.2: the toolbar actions write into the same seed the list reads.
  registerOperacoesRoutes(app, { repo: docsRepo, db: memoryOperacoesDb(docsSeed) });
  // Step 8.1: Backups over their own copy of the documents (the Documentos e2e data stays as is);
  // a printed document (N_IMPRESSOES > 0) is printed on its DATA_PEDIDO.
  registerBackupsRoutes(app, {
    repo: memoryBackupsRepo({
      documentos: documentosSeed().documentos.map((d) => ({
        ...d,
        DATA_IMPRESSAO: Number(d['N_IMPRESSOES']) > 0 ? d['DATA_PEDIDO'] : null,
        BACKUP_ID: null,
      })),
      tiposMidia: seedTiposMidia(),
      backups: [],
      fila: [],
    }),
    getVariavel: async (nome) => ({ BACKUP: '\\\\SRV-SIID\\BACKUPS\\', ONLINE: 'E:\\', PASSWORD: null })[nome],
  });

  const m = seedModelos();
  const modelosStores: ModelosStores = {
    modelos: memoryStore(modelos, m.modelos),
    seccoes: memoryStore(modelosSeccoes, m.seccoes, { dedupeKeys: ['TIPOSEC_ID'] }),
    condicoes: memoryStore(modelosCondicoes, m.condicoes, { dedupeKeys: ['CDUNIECO', 'CDRAMO', 'CONTEXTO_ID'] }),
    omissao: memoryStore(modelosParametrosOmissao, m.omissao),
    atributosEdoc: memoryStore(modelosAtributosEdoc, m.edoc, { dedupeKeys: ['EDOC_ID'] }),
    atributosArquivo: memoryStore(modelosAtributosArquivo, m.arquivo, { dedupeKeys: ['ARQ_ID'] }),
  };
  registerModelosRoutes(app, {
    stores: modelosStores,
    repo: memoryModelosRepo({
      stores: modelosStores,
      parametros: m.parametros,
      tiposConteudo: m.tiposConteudo,
      contextos: m.contextos,
    }),
    imageStore: memoryImageStore({
      exists: async (k) =>
        (
          await modelosStores.seccoes.list(
            {
              filters: {
                TIPOSEC_ID: [{ op: 'eq', value: String(k['TIPOSEC_ID']) }],
                ALINEA: [{ op: 'eq', value: String(k['ALINEA']) }],
              },
              sort: [],
              page: 1,
              size: 1,
            },
            { MODELO_ID: String(k['MODELO_ID']) },
            admCtx,
          )
        ).total > 0,
    }),
    maxBytes: 1024 * 1024,
  });
}

// ── Perfis de departamento (Step 5.5) ────────────────────────────────────────────────────────
const DEV_EMPREGADOS = [
  { CDEMPLEA: 'AB1001X', CDDEPARTA: 'OD68', SWACTIVO: 'S' },
  { CDEMPLEA: 'CD2002Y', CDDEPARTA: 'OD68', SWACTIVO: 'S' },
  { CDEMPLEA: 'EF3003Z', CDDEPARTA: 'OD01', SWACTIVO: 'S' },
  { CDEMPLEA: 'GH4004W', CDDEPARTA: 'OD01', SWACTIVO: 'N' },
];
const DEV_FUNCOES = [
  { ID: 'GCOM', NOME: 'Gestor Comercial', REGISTO_VALIDO: 'S' },
  { ID: 'GCON', NOME: 'Gestor de Conta', REGISTO_VALIDO: 'S' },
  { ID: 'ANTIGA', NOME: 'Função antiga', REGISTO_VALIDO: 'N' },
];
// TTAPVAAT tables 6 (→ GCOM) and 7 (→ GCON). GC1001 is already used by the seeded perfil.
const DEV_TTAPVAAT = [
  { NMTABLA: 6, OTCLAVE1: 'GC1001' },
  { NMTABLA: 6, OTCLAVE1: 'GC2002' },
  { NMTABLA: 7, OTCLAVE1: 'GC3003' },
];
function seedPerfis(): Row[] {
  const perfil = (ID: number, CDEMPLEA: string, CDDEPARTA: string, CODIGO: string, F: string, DESCRICAO: string) => ({
    ID,
    CDEMPLEA,
    CDDEPARTA,
    DATA_INICIO: '2024-01-01T00:00:00',
    DATA_FIM: null,
    CODIGO,
    FUNCAODEP_ID: F,
    NOME: DEV_FUNCOES.find((f) => f.ID === F)?.NOME ?? null,
    DESCRICAO,
    EMAIL: null,
    TELEFONE: null,
    FAX: null,
    TELEMOVEL: null,
    CRIADO_POR: 'MIGRACAO',
    DATA_CRIACAO: '2024-01-01T10:00:00',
    ACTUALIZADO_POR: null,
    DATA_ACTUALIZACAO: null,
  });
  return [
    perfil(1, 'AB1001X', 'OD68', 'GC1001', 'GCOM', 'Ana Ribeiro'),
    perfil(2, 'EF3003Z', 'OD01', 'GC9009', 'GCON', 'Eva Fonseca'),
  ];
}

// ── Permissões (Step 5.3) ────────────────────────────────────────────────────────────────────

// Real TIPO_PERMISSAO rows (CFG_VALORES_DOMINIO.md); units and users are made up.
const TIPOS_PERMISSAO: Record<number, string> = Object.fromEntries(
  DOMINIOS[PERMISSOES_DOMINIOS.tipo]!.map((v) => [Number(v.CHAVE), v.DESIGNACAO]),
);
const UNIDADES: Record<string, string> = { DSI: 'DSI', DFI: 'DFI' };
const PERM_UTILIZADORES: Utilizador[] = [
  { USERNAME: 'USER1', NOME: 'Ana Silva', UNIDADE_NEGOCIO_RF: 'DSI' },
  { USERNAME: 'USER2', NOME: 'Bruno Costa', UNIDADE_NEGOCIO_RF: 'DSI' },
  { USERNAME: 'USER3', NOME: 'Carla Sousa', UNIDADE_NEGOCIO_RF: 'DFI' },
  { USERNAME: 'USER4', NOME: 'Duarte Lopes', UNIDADE_NEGOCIO_RF: 'DFI' },
];

function seedPermissoes() {
  const modelo = (ID: string, REPORT_ID = 1): Modelo => ({
    ID,
    REPORT_ID,
    DATA_INICIO: '2020-01-01T00:00:00',
    DATA_FIM: null,
  });
  const p = (MODELO_ID: string, USERNAME: string, over: Partial<Perm> = {}) => ({
    MODELO_ID,
    USERNAME,
    UNIDADE_NEGOCIO_RF: PERM_UTILIZADORES.find((u) => u.USERNAME === USERNAME)?.UNIDADE_NEGOCIO_RF ?? 'DSI',
    TIPO_PERMISSAO_RF: 1,
    DATA_INICIO: '2024-01-01T00:00:00',
    DATA_FIM: FIM_BULK,
    ...audit,
    ...over,
  });
  return {
    modelos: [modelo('MOD1'), modelo('MOD2'), modelo('MOD3'), modelo('MOD4'), modelo('MOD46', 46)],
    utilizadores: PERM_UTILIZADORES,
    perms: [
      p('MOD1', 'USER1'),
      p('MOD2', 'USER1'),
      p('MOD1', 'USER1', { TIPO_PERMISSAO_RF: 4 }),
      p('MOD1', 'USER2'),
      p('MOD3', 'USER3'),
      p('MOD2', 'USER2', { DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' }),
    ],
  };
}

/** CFG_PERMISSOES_SIID_VW over the repo's current rows (inner join on users, as the view). */
function permissoesVista(repo: ReturnType<typeof memoryPermissoesRepo>): CrudStore {
  const view = () =>
    memoryStore(
      permissoes,
      repo.snapshot().flatMap((row) => {
        const u = PERM_UTILIZADORES.find((x) => x.USERNAME === row.USERNAME);
        if (!u) return [];
        return [
          {
            ...row,
            NOME: u.NOME,
            AMBIENTE_ID: DEV_AMBIENTE,
            UNIDADE_NEGOCIO: UNIDADES[row.UNIDADE_NEGOCIO_RF] ?? null,
            TIPO_PERMISSAO: TIPOS_PERMISSAO[row.TIPO_PERMISSAO_RF] ?? null,
          },
        ];
      }),
      { presets: { validas: (r) => validaHoje(r as unknown as Perm, localNow()) } },
    );
  return {
    list: (q, parent, ctx) => view().list(q, parent, ctx),
    get: (rid, ctx) => view().get(rid, ctx),
    insert: (v, parent, ctx) => view().insert(v, parent, ctx),
    update: (rid, orig, v, ctx) => view().update(rid, orig, v, ctx),
    remove: (rid, orig, ctx) => view().remove(rid, orig, ctx),
  };
}

// ── Modelos (Step 6.1) ───────────────────────────────────────────────────────────────────────

function seedModelos() {
  const modelo = (ID: string, DESCRICAO: string, over: Row = {}): Row => ({
    ID,
    DESCRICAO,
    N_COPIAS: 1,
    FORMA_CONTROLO_RF: 'C',
    DATA_INICIO: '2020-01-01T00:00:00',
    DATA_FIM: null,
    MODO_EXPEDICAO_RF: 'I',
    STAMP: 'N',
    MODO_CERTIFICADO_RF: '0',
    GENERICO_ID: null,
    MODO_PROTECAO_RF: '0',
    TIPO_DOCUMENTO_RF: 'DOC',
    REPORT_ID: 1,
    N_ANEXOS: 0,
    MAX_IMPRESSOES: 0,
    BARCODE_TYPE: null,
    BARCODE_FORMAT: null,
    BARCODE_WEIGHT: null,
    BARCODE_HEIGHT: null,
    BARCODE_X_POSITION: null,
    BARCODE_Y_POSITION: null,
    ...audit,
    ...over,
  });
  const seccao = (MODELO_ID: string, TIPOSEC_ID: string, ALINEA: number, TITULO: string): Row => ({
    MODELO_ID,
    TIPOSEC_ID,
    ALINEA,
    TITULO,
    TEXTO: `Texto de ${TITULO}`,
    TIPOCNTD_ID: 1,
    FORMULA_ID: null,
    TIPO_IMAGEM: null,
    ...audit,
  });
  const condicao = (MODELO_ID: string, TIPOSEC_ID: string, ALINEA: number, CDRAMO: string): Row => ({
    MODELO_ID,
    TIPOSEC_ID,
    ALINEA,
    DATA_INICIO: '2020-01-01T00:00:00',
    DATA_FIM: null,
    CDUNIECO: 1,
    CDRAMO,
    CONTEXTO_ID: 1,
    ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`ATRIBUTO${n}`, null])),
    ...audit,
  });
  const atributo = (MODELO_ID: string, N_ATRIBUTO: number, NOME_PARAMETRO: string): Row => ({
    MODELO_ID,
    CDUNIECO: 1,
    CDRAMO: 'AUTO',
    N_ATRIBUTO,
    DESCRICAO: NOME_PARAMETRO,
    NOME_PARAMETRO,
    ORDEM_PARAMETRO: N_ATRIBUTO,
    VALOR_OMISSAO: null,
    TIPO_PARAMETRO: 'D',
    DATA_INICIO: '2020-01-01T00:00:00',
    DATA_FIM: null,
    ...audit,
  });
  const parametro = (N_PARAMETRO: number, NOME: string) => ({
    REPORT_ID: 1,
    N_PARAMETRO,
    NOME,
    TIPO_PARAMETRO_RF: N_PARAMETRO === 1 ? '2' : '1',
    OBRIGATORIO: 'S',
    CHECK_UNIQUE: 'N',
    VALIDO: 'S',
    DESCRICAO: NOME,
  });
  return {
    modelos: [
      modelo('MOD1', 'Carta ao cliente', { GENERICO_ID: 'GEN1', BARCODE_TYPE: 'CODE_128', BARCODE_WEIGHT: 4, BARCODE_HEIGHT: 1 }),
      modelo('MOD2', 'Aviso de pagamento', { MODO_EXPEDICAO_RF: 'M', STAMP: 'S' }),
      modelo('GEN1', 'Genérico cartas', { TIPO_DOCUMENTO_RF: 'GNR', REPORT_ID: null }),
    ],
    seccoes: [
      seccao('MOD1', 'CAB', 1, 'Cabeçalho'),
      seccao('MOD1', 'CORPO', 1, 'Corpo'),
      seccao('MOD1', 'CORPO', 2, 'Corpo (continuação)'),
      seccao('MOD2', 'CAB', 1, 'Cabeçalho'),
    ],
    condicoes: [condicao('MOD1', 'CAB', 1, 'AUTO'), condicao('MOD1', 'CAB', 1, 'VIDA'), condicao('MOD2', 'CAB', 1, 'AUTO')],
    omissao: [
      {
        MODELO_ID: 'MOD1',
        N_PARAMETRO: 2,
        VALOR: 'PT',
        DATA_INICIO: '2024-01-01T00:00:00',
        DATA_FIM: null,
        NOME_CONSULTA: null,
        CONSULTA_ONLINE: 'N',
        ...audit,
      },
    ],
    edoc: [{ EDOC_ID: 1, ...atributo('MOD1', 1, 'NIF') }, { EDOC_ID: 1, ...atributo('MOD1', 2, 'APOLICE') }],
    arquivo: [{ ARQ_ID: 1, ...atributo('MOD1', 1, 'NIF') }],
    parametros: [parametro(1, '_USER'), parametro(2, 'P_PAIS'), parametro(3, 'P_DATAACTUAL')],
    tiposConteudo: [
      { ID: 1, DESCRICAO: 'Texto' },
      { ID: 2, DESCRICAO: 'Imagem' },
    ],
    contextos: [{ ID: 1, DESCRICAO: 'Contexto geral' }],
  };
}
