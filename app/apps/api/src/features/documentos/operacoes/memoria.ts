import { pt } from '@gestsiid/shared';
import { AppError } from '../../../db/errors.ts';
import type { Row } from '../../../lib/crud.ts';
import type { DocumentosSeed } from '../repo.ts';
import { CANCELAR_ESTADOS, type DocOperacao } from './regras.ts';
import type { OperacoesDb } from './servico.ts';

/**
 * OperacoesDb over a {@link DocumentosSeed} (dev server, unit tests): the same outcomes as
 * oracle.ts, written into the seed arrays the read repo serves. `DISPONIBILIDADE` plays
 * `DISPONIVEL_RF`; `fila` is SVR_QUEUE; `erros` is ERR_ERROS_SIID.
 */
export function memoryOperacoesDb(seed: DocumentosSeed): OperacoesDb {
  const fila = (seed.fila ??= []);
  const erros = (seed.erros ??= []);
  const parametros = (seed.parametros ??= []);
  const modelos = new Map((seed.modelos ?? []).map((m) => [m.ID, m.MODO_EXPEDICAO_RF]));
  const num = (v: unknown) => (v == null ? null : Number(v));
  const maxId = (rows: Row[]) => rows.reduce((m, r) => Math.max(m, Number(r['ID'] ?? 0)), 0);
  const doc = (id: number) => seed.documentos.find((d) => d['ID'] === id);
  const deDoc = (id: number) => fila.filter((q) => q['DOCUMENTO_ID'] === id);

  const novaFila = (user: string, over: Row): Row => {
    const row: Row = {
      ID: maxId(fila) + 1,
      DOCUMENTO_ID: null,
      TIPO_QUEUE_RF: null,
      DATA_PEDIDO: new Date().toISOString().slice(0, 19),
      CRIADO_POR: user,
      DATA_EXECUCAO: null,
      DATA_FINALIZACAO: null,
      ESTADO: 'ESPERA',
      IMPRESSORA_ID: null,
      IMPRESSORA: null,
      RESULTADO: null,
      ATRIBUTO01: null,
      ...over,
    };
    fila.push(row);
    return row;
  };
  const muda = (rows: Row[], estado: string) => {
    for (const r of rows) r['ESTADO'] = estado;
    return rows.length;
  };

  return {
    async lerDocumentos(_user, ids) {
      return ids.flatMap((id): DocOperacao[] => {
        const d = doc(id);
        if (!d) return [];
        return [
          {
            ID: id,
            ATRIBUTO9: (d['ATRIBUTO9'] as string | null) ?? null,
            DISPONIVEL_RF: (d['DISPONIBILIDADE'] as string | null) ?? null,
            N_IMPRESSOES: num(d['N_IMPRESSOES']),
            ARQ_ID: num(d['ARQ_ID']),
            MODELO_ID: (d['MODELO_ID'] as string | null) ?? null,
            LOTE_ID: num(d['LOTE_ID']),
            MODO_EXPEDICAO_RF: modelos.get(String(d['MODELO_ID'])) ?? null,
            IMPRESSAO_TERMINADA: deDoc(id).filter((q) => q['TIPO_QUEUE_RF'] === 'IMPRESSAO' && q['ESTADO'] === 'TERMINADO').length,
          },
        ];
      });
    },

    async modoEdoc(_user, id) {
      const d = doc(id);
      if (!d || !modelos.has(String(d['MODELO_ID']))) return null;
      const modo = modelos.get(String(d['MODELO_ID'])) ?? null;
      return modo === 'W' && !(seed.edocOk ?? []).includes(id) ? 'I' : modo;
    },

    async ultimoEmail(_user, id) {
      const emails = deDoc(id)
        .filter((q) => q['TIPO_QUEUE_RF'] === 'EMAIL' && q['ATRIBUTO01'] != null)
        .map((q) => String(q['ATRIBUTO01']));
      return emails.length ? emails.sort().at(-1)! : null;
    },

    async impressoraValida(_user, id) {
      return (seed.impressorasValidas ?? []).includes(id);
    },

    async enfileirar(user, pedidos) {
      for (const p of pedidos) {
        novaFila(user.username, {
          DOCUMENTO_ID: p.documentoId,
          TIPO_QUEUE_RF: p.tipo,
          IMPRESSORA_ID: p.impressoraId ?? null,
          ATRIBUTO01: p.atributo01 ?? null,
        });
        if (p.auditoria !== undefined)
          erros.push({
            ID: maxId(erros) + 1,
            DOCUMENTO_ID: p.documentoId,
            DATA_ERRO: new Date().toISOString().slice(0, 19),
            DESCRICAO: p.auditoria,
          });
      }
    },

    async anular(user, id) {
      const d = doc(id);
      if (!d) return undefined;
      d['DISPONIBILIDADE'] = 'ANU';
      novaFila(user.username, { DOCUMENTO_ID: id, TIPO_QUEUE_RF: 'ANULADO', ESTADO: 'TERMINADO' });
      return 'ANU';
    },

    async cancelar(_user, ids, force) {
      const estados: readonly string[] = CANCELAR_ESTADOS;
      return muda(
        fila.filter(
          (q) =>
            ids.includes(Number(q['DOCUMENTO_ID'])) &&
            q['TIPO_QUEUE_RF'] === 'EXECUCAO' &&
            (force || estados.includes(String(q['ESTADO']))),
        ),
        'CANCELLED',
      );
    },

    async mudarEstadoFila(_user, de, para, alvo) {
      return muda(
        fila.filter((q) => q['ESTADO'] === de && (alvo === 'todos' || alvo.includes(Number(q['DOCUMENTO_ID'])))),
        para,
      );
    },

    async cancelarPedido(_user, documentoId, queueId) {
      const q = fila.find((r) => r['ID'] === queueId && r['DOCUMENTO_ID'] === documentoId);
      if (!q) throw new AppError(409, 'REGISTO_ALTERADO', 'O registo foi alterado por outro utilizador. Volte a consultar.');
      if (!['ESPERA', 'TERMINADO'].includes(String(q['ESTADO'])))
        throw new AppError(409, 'PEDIDO_NAO_CANCELAVEL', pt.documentos.pedidoNaoCancelavel);
      q['ESTADO'] = 'CANCELLED';
    },

    async contagemFila(_user, estado) {
      return fila.filter((q) => q['ESTADO'] === estado).length;
    },

    async clonar(user, origem, params) {
      const id = maxId(seed.documentos) + 1;
      const base = seed.documentos[0] ?? {};
      seed.documentos.push({
        ...Object.fromEntries(Object.keys(base).map((k) => [k, null])),
        ID: id,
        MODELO_ID: origem.MODELO_ID,
        LOTE_ID: origem.LOTE_ID,
        ESTADO: null,
        CRIADO_POR: user.username,
        DATA_PEDIDO: new Date().toISOString().slice(0, 19),
        DISPONIBILIDADE: 'ONLINE',
      });
      novaFila(user.username, { DOCUMENTO_ID: id, TIPO_QUEUE_RF: 'EXECUCAO' });
      params.forEach((p, i) =>
        parametros.push({ DOCUMENTO_ID: id, NOME: p.nome, VALOR: p.valor, N_PARAMETRO: i + 1, MODELO_ID: origem.MODELO_ID }),
      );
      return id;
    },
  };
}
