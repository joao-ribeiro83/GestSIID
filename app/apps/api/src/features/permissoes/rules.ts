/**
 * `FD_PERMISSOES_SIID` rules (BR-PERM-01..11) as pure functions over plain rows. The trigger text
 * is the source: NOVA_PERMISSAO.OK, ALTERAR_PERMISSAO.OK, COPIAR_PERMISSOES(_UTILIZADOR).OK,
 * CTR_USERS_SIID / CTR_MODELOS_SIID ADD_* / REMOVE_*, and the view CTR_SEM_PERMISSAO_USER_VW.
 * Dates are `YYYY-MM-DDTHH:MM:SS` strings, so text order is time order. `now` stands for SYSDATE.
 */

export const OBRIGATORIO = 'Todos os campos são obrigatórios, excepto a data de fim.';
export const OBRIGATORIO_DATA_INICIO = "O Campo 'Data de Início' é de preenchimento obrigatório.";
export const JA_EXISTE = 'ERRO: Permissão já existe válida para o intervalo definido!!';
export const SOBREPOE = 'ERRO: O intervalo de datas sobrepõe-se a uma permissão já existente!';

/** `TO_DATE('31-12-2200','DD/MM/YYYY')`: DATA_FIM of rows added from the panels. */
export const FIM_BULK = '2200-12-31T00:00:00';
/** `TO_DATE('01/01/1980','DD/MM/RRRR')`: DATA_FIM of a row annulled from the grid (BR-PERM-06). */
export const FIM_ANULADA = '1980-01-01T00:00:00';
/** `DATE '9999-12-31'`: stands for a NULL DATA_FIM in the overlap checks. */
const SEM_FIM = '9999-12-31T00:00:00';

export interface Perm {
  MODELO_ID: string;
  USERNAME: string;
  UNIDADE_NEGOCIO_RF: string;
  TIPO_PERMISSAO_RF: number;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}
/** The logical key (PK_CHAVE_CPS). */
export type PermKey = Omit<Perm, 'DATA_FIM'>;
export interface Modelo {
  ID: string;
  REPORT_ID: number | null;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}
export interface Utilizador {
  USERNAME: string;
  NOME: string | null;
  UNIDADE_NEGOCIO_RF: string;
}
export interface SemRow {
  MODELO_ID: string;
  USERNAME: string;
  NOME: string | null;
}
export interface Scope {
  UNIDADE_NEGOCIO_RF: string;
  TIPO_PERMISSAO_RF: number;
  USERNAME?: string;
  MODELO_ID?: string;
}

export const normalizaData = (v: string): string => (v.length === 10 ? `${v}T00:00:00` : v);

/** `SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE + 1)`. */
export const validaHoje = (p: { DATA_INICIO: string; DATA_FIM: string | null }, now: string): boolean =>
  p.DATA_INICIO <= now && now <= (p.DATA_FIM ?? SEM_FIM);

/** `SYSDATE <= NVL(DATA_FIM, SYSDATE)`. */
export const naoExpirada = (p: { DATA_FIM: string | null }, now: string): boolean =>
  p.DATA_FIM == null || now <= p.DATA_FIM;

/** `aIni <= NVL(bFim, 9999-12-31) AND NVL(aFim, 9999-12-31) >= bIni`. */
export const sobrepoe = (aIni: string, aFim: string | null, bIni: string, bFim: string | null): boolean =>
  aIni <= (bFim ?? SEM_FIM) && (aFim ?? SEM_FIM) >= bIni;

/** `SYSDATE - 1`: same time, one calendar day earlier. */
export function diaAnterior(now: string): string {
  const d = new Date(`${now}Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 19);
}

const mesmaChave = (a: Omit<PermKey, 'DATA_INICIO'>, b: Omit<PermKey, 'DATA_INICIO'>): boolean =>
  a.USERNAME === b.USERNAME &&
  a.MODELO_ID === b.MODELO_ID &&
  a.UNIDADE_NEGOCIO_RF === b.UNIDADE_NEGOCIO_RF &&
  a.TIPO_PERMISSAO_RF === b.TIPO_PERMISSAO_RF;

/** NOVA_PERMISSAO.OK count: any row of the same key overlapping, expired ones included. */
export const conflitoNova = (existentes: readonly Perm[], nova: Perm): boolean =>
  existentes.some(
    (e) => mesmaChave(e, nova) && sobrepoe(nova.DATA_INICIO, nova.DATA_FIM, e.DATA_INICIO, e.DATA_FIM),
  );

/** ALTERAR_PERMISSAO.OK count: as {@link conflitoNova}, without the row being edited. */
export const conflitoAlterar = (
  existentes: readonly Perm[],
  chave: PermKey,
  novoIni: string,
  novoFim: string | null,
): boolean =>
  existentes.some(
    (e) =>
      mesmaChave(e, chave) &&
      e.DATA_INICIO !== chave.DATA_INICIO &&
      sobrepoe(novoIni, novoFim, e.DATA_INICIO, e.DATA_FIM),
  );

/**
 * CTR_SEM_PERMISSAO_USER_VW for one panel: users of the scope's unit × models valid today with
 * `REPORT_ID <> 46` (NULL excluded, as in SQL), minus pairs with a permission valid today.
 */
export function semPermissao(
  modelos: readonly Modelo[],
  utilizadores: readonly Utilizador[],
  perms: readonly Perm[],
  scope: Scope,
  now: string,
): SemRow[] {
  const ms = modelos.filter(
    (m) =>
      m.REPORT_ID != null &&
      m.REPORT_ID !== 46 &&
      validaHoje(m, now) &&
      (scope.MODELO_ID === undefined || m.ID === scope.MODELO_ID),
  );
  const us = utilizadores.filter(
    (u) =>
      u.UNIDADE_NEGOCIO_RF === scope.UNIDADE_NEGOCIO_RF &&
      (scope.USERNAME === undefined || u.USERNAME === scope.USERNAME),
  );
  const out: SemRow[] = [];
  for (const u of us)
    for (const m of ms) {
      const tem = perms.some(
        (p) =>
          mesmaChave(p, { ...scope, MODELO_ID: m.ID, USERNAME: u.USERNAME }) && validaHoje(p, now),
      );
      if (!tem) out.push({ MODELO_ID: m.ID, USERNAME: u.USERNAME, NOME: u.NOME });
    }
  const by = scope.MODELO_ID === undefined ? 'MODELO_ID' : 'USERNAME';
  return out.sort((a, b) => (a[by] < b[by] ? -1 : a[by] > b[by] ? 1 : 0));
}

/** INSERT … SELECT … NOT EXISTS: non-expired source rows, mapped, unless the target (as it was
 * before the copy) has a row of the same key overlapping them. */
function planoCopia(
  origem: readonly Perm[],
  destino: readonly Perm[],
  mapeia: (p: Perm) => Perm,
  now: string,
): Perm[] {
  return origem
    .filter((p) => naoExpirada(p, now))
    .map(mapeia)
    .filter(
      (n) =>
        !destino.some(
          (d) => mesmaChave(d, n) && sobrepoe(n.DATA_INICIO, n.DATA_FIM, d.DATA_INICIO, d.DATA_FIM),
        ),
    );
}

/** BR-PERM-10: copy every permission of a model onto `modeloDestino`. */
export const planoCopiaModelo = (
  origem: readonly Perm[],
  destino: readonly Perm[],
  modeloDestino: string,
  now: string,
): Perm[] => planoCopia(origem, destino, (p) => ({ ...p, MODELO_ID: modeloDestino }), now);

/** BR-PERM-11: copy every permission of a user+unit onto `alvo`. */
export const planoCopiaUtilizador = (
  origem: readonly Perm[],
  destino: readonly Perm[],
  alvo: { USERNAME: string; UNIDADE_NEGOCIO_RF: string },
  now: string,
): Perm[] => planoCopia(origem, destino, (p) => ({ ...p, ...alvo }), now);
