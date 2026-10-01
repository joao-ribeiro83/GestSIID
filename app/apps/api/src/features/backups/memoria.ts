import { backups, backupsCandidatos, pt } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import type { Row } from '../../lib/crud.ts';
import { memoryStore } from '../dev/memoryStore.ts';
import type { BackupsRepo } from './repo.ts';

/**
 * BackupsRepo in memory (unit tests, dev server): the same rules as oracle.ts over plain arrays,
 * which it mutates in place. Validation happens before any write, so a rejected backup changes
 * nothing (Oracle: the transaction rolls back).
 */

const MB = 1024 * 1024;
const agora = () => new Date().toISOString().slice(0, 19);
// memoryStore adds `_rid`; Oracle selects none for a read-only resource.
const semRid = (r: Row) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== '_rid'));
const alterado = () => new AppError(409, 'REGISTO_ALTERADO', 'O registo foi alterado por outro utilizador. Volte a consultar.');
const invalido = (field: string, msg: string) => new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { [field]: msg } });

export function memoryBackupsRepo(dados: { documentos: Row[]; tiposMidia: Row[]; backups: Row[]; fila: Row[] }): BackupsRepo {
  const { documentos, tiposMidia, fila } = dados;
  const doMes = (mes: string) => (d: Row) => d['BACKUP_ID'] == null && String(d['DATA_IMPRESSAO'] ?? '').startsWith(mes);
  const bytes = (ds: Row[]) => ds.reduce((s, d) => s + (Number(d['TAMANHO_BYTES']) || 0), 0);
  const maxId = (rs: Row[]) => Math.max(0, ...rs.map((r) => Number(r['ID']) || 0));

  return {
    meses: async () =>
      [...new Set(documentos.filter((d) => d['BACKUP_ID'] == null && d['DATA_IMPRESSAO'] != null).map((d) => String(d['DATA_IMPRESSAO']).slice(0, 7)))]
        .sort()
        .reverse()
        .map((MES) => ({ MES, DATA: `01/${MES.slice(5, 7)}/${MES.slice(0, 4)}` })),

    lista: async (q, ctx) => {
      const comTamanho = dados.backups.map((b) => {
        const ds = documentos.filter((d) => d['BACKUP_ID'] === b['ID']);
        return { ...b, TAMANHO_BACKUP: ds.length === 0 ? null : bytes(ds) / MB };
      });
      const r = await memoryStore(backups, comTamanho).list(q, {}, ctx);
      return { rows: r.rows.map(semRid), total: r.total };
    },

    candidatos: async (q, mes, ctx) => {
      const r = await memoryStore(backupsCandidatos, documentos).list(q, {}, ctx);
      return { rows: r.rows.map(semRid), total: r.total, totalBytes: bytes(documentos.filter(doMes(mes))) };
    },

    criar: async (novo, ctx) => {
      const midia = tiposMidia.find((m) => m['ID'] === novo.tipoMidiaId);
      if (!midia) throw invalido('tipoMidiaId', pt.backups.tipoMidiaInexistente);
      const candidatos = documentos.filter(doMes(novo.mes));
      const escolhidos =
        novo.ids === 'todos' ? candidatos : candidatos.filter((d) => (novo.ids as number[]).includes(d['ID'] as number));
      if (novo.ids === 'todos' && escolhidos.length === 0) throw invalido('seleccao', pt.naoExistemDocumentosSeleccionados);
      if (novo.ids !== 'todos' && escolhidos.length < novo.ids.length) throw alterado();
      const tamanho = midia['TAMANHO_BYTES'] as number | null;
      if (tamanho !== null && tamanho < bytes(escolhidos)) throw invalido('tipoMidiaId', pt.backups.tamanhoMidia);

      const yyyymm = novo.mes.replace('-', '');
      const n = dados.backups.filter((b) => String(b['NOME']).startsWith(`COSEC_${yyyymm}`)).length + 1;
      // ponytail: TO_CHAR(n,'00') — sign blank + 2 digits; past 99 Oracle prints '###', not mirrored here.
      const nome = `COSEC_${yyyymm}_ ${String(n).padStart(2, '0')}`;
      const ID = maxId(dados.backups) + 1;
      dados.backups.push({
        ID,
        NOME: nome,
        MES_BACKUP: `${novo.mes}-01T00:00:00`,
        TIPO_MIDIA_ID: novo.tipoMidiaId,
        DESTINO: novo.destino + nome,
        OBSERVACOES: novo.observacoes,
        MEDIA_ONLINE: 'N',
        DRIVE_ONLINE: null,
        CRIADO_POR: ctx.user.username,
        DATA_CRIACAO: agora(),
      });
      let filaId = maxId(fila);
      for (const d of escolhidos) {
        d['BACKUP_ID'] = ID;
        fila.push({ ID: ++filaId, TIPO_QUEUE_RF: 'BACKUP', DOCUMENTO_ID: d['ID'], DATA_PEDIDO: agora(), ESTADO: 'ESPERA', CRIADO_POR: ctx.user.username });
      }
      return { ID, NOME: nome };
    },

    online: async (ids, online, drive) => {
      const alvo = ids.map((id) => dados.backups.find((b) => b['ID'] === id));
      if (alvo.some((b) => !b)) throw alterado();
      for (const b of alvo) Object.assign(b!, { MEDIA_ONLINE: online ? 'S' : 'N', DRIVE_ONLINE: drive });
    },
  };
}
