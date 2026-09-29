import { diaAnterior } from '../permissoes/rules.ts';

/**
 * Pure rules of FD_CONFIGURACAO_MODELOS (BR-MOD-03, 07..10). Dates are `YYYY-MM-DDTHH:MM:SS`
 * strings (they compare as text); `agora` is SYSDATE.
 */

export const MODELO_EXISTENTE = 'Já existe um modelo com esta referência';
export const APAGAR_MESTRE =
  'Impossível apagar registo mestre se existirem registos de detalhe correspondentes.';
export const INICIO_SUPERIOR = 'A data de inicio é superior à data de fim.';
export const INICIO_EM_INTERVALO = 'A data de inicio econtra-se num intervalo já definido.';
export const FIM_EM_INTERVALO = 'A data de fim econtra-se num intervalo já definido.';

export interface Omissao {
  DATA_INICIO: string;
  DATA_FIM: string | null;
  VALOR: string | null;
  NOME_CONSULTA: string | null;
  CONSULTA_ONLINE: string | null;
}

export interface PedidoOmissao {
  VALOR: string | null;
  DATA_INICIO: string | null;
  DATA_FIM: string | null;
  NOME_CONSULTA: string | null;
  CONSULTA_ONLINE: string;
}

export type OpOmissao =
  | { tipo: 'inserir'; row: Omissao }
  | { tipo: 'fechar'; DATA_INICIO: string; DATA_FIM: string }
  | {
      tipo: 'actualizar';
      DATA_INICIO: string;
      set: Pick<Omissao, 'VALOR' | 'DATA_FIM' | 'NOME_CONSULTA' | 'CONSULTA_ONLINE'>;
    };

const dia = (d: string) => d.slice(0, 10);

/** `SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE)`, latest start first (D-28 fixes the
 * form's `ROWNUM = 1` before `ORDER BY`). */
export function omissaoActual(rows: readonly Omissao[], agora: string): Omissao | undefined {
  return rows
    .filter((r) => r.DATA_INICIO <= agora && agora <= (r.DATA_FIM ?? agora))
    .reduce<Omissao | undefined>((a, r) => (!a || r.DATA_INICIO > a.DATA_INICIO ? r : a), undefined);
}

/**
 * WHEN-WINDOW-CLOSED of PARAMETROS_REPORT for one parameter row (BR-MOD-09). `rows` = every
 * default of (model, parameter). Without a date the new row starts today at midnight; the form
 * compared NULL there and failed with ORA-01400 whenever an open row existed (intended fix).
 */
export function planoOmissao(rows: readonly Omissao[], pedido: PedidoOmissao, agora: string): OpOmissao[] {
  const { VALOR, DATA_FIM, NOME_CONSULTA, CONSULTA_ONLINE } = pedido;
  if (pedido.DATA_INICIO === null) {
    if (VALOR === null && DATA_FIM === null && NOME_CONSULTA === null && CONSULTA_ONLINE === 'N')
      return [];
  } else {
    const mesmoDia = rows.find((r) => dia(r.DATA_INICIO) === dia(pedido.DATA_INICIO!));
    if (mesmoDia)
      return [
        {
          tipo: 'actualizar',
          DATA_INICIO: mesmoDia.DATA_INICIO,
          set: { VALOR, DATA_FIM, NOME_CONSULTA, CONSULTA_ONLINE },
        },
      ];
  }

  const inicio = pedido.DATA_INICIO ?? `${dia(agora)}T00:00:00`;
  const nova = (fim: string | null): OpOmissao => ({
    tipo: 'inserir',
    row: { DATA_INICIO: inicio, DATA_FIM: fim, VALOR, NOME_CONSULTA, CONSULTA_ONLINE },
  });
  const aberta = rows.find((r) => r.DATA_FIM === null);
  if (!aberta) return [nova(DATA_FIM)];
  if (inicio > aberta.DATA_INICIO)
    return [
      { tipo: 'fechar', DATA_INICIO: aberta.DATA_INICIO, DATA_FIM: diaAnterior(inicio) },
      nova(DATA_FIM),
    ];
  // A value in the past: it ends the day before the next start (the request's DATA_FIM is ignored).
  const seguinte = rows
    .map((r) => r.DATA_INICIO)
    .filter((d) => d > inicio)
    .sort()[0];
  return [nova(seguinte ? diaAnterior(seguinte) : null)];
}

/** POST-CHANGE of DATA_INICIO / DATA_FIM on DOC_PARAMETROS_OMISSAO (BR-MOD-10). Only the endpoints
 * are tested, as in the form. */
export function erroIntervalo(
  outros: readonly { DATA_INICIO: string; DATA_FIM: string | null }[],
  ini: string,
  fim: string | null,
  agora: string,
  mudou: { inicio: boolean; fim: boolean },
): { campo: 'DATA_INICIO' | 'DATA_FIM'; mensagem: string } | null {
  if (fim !== null && ini > fim) return { campo: 'DATA_INICIO', mensagem: INICIO_SUPERIOR };
  const dentro = (d: string) =>
    outros.some((r) => r.DATA_INICIO <= d && d <= (r.DATA_FIM ?? agora));
  if (mudou.inicio && dentro(ini)) return { campo: 'DATA_INICIO', mensagem: INICIO_EM_INTERVALO };
  if (mudou.fim && fim !== null && dentro(fim))
    return { campo: 'DATA_FIM', mensagem: FIM_EM_INTERVALO };
  return null;
}
