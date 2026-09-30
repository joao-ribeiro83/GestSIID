import { pt } from '@gestsiid/shared';

/**
 * Pure rules of the FD_GESTAO_SIID batch operations (Step 7.2, analysis/DOCUMENT_STATES.md).
 * Each function is one Forms trigger or program unit condition; the texts are the OUT alert
 * headers of BUSINESS_RULES.md §3.
 */

/** One SVR_DOCUMENTOS row with its model's dispatch mode and its finished-print count. */
export interface DocOperacao {
  ID: number;
  ATRIBUTO9: string | null;
  DISPONIVEL_RF: string | null;
  N_IMPRESSOES: number | null;
  ARQ_ID: number | null;
  MODELO_ID: string | null;
  LOTE_ID: number | null;
  MODO_EXPEDICAO_RF: string | null;
  /** COUNT(*) of SVR_QUEUE rows TIPO_QUEUE_RF='IMPRESSAO' AND ESTADO='TERMINADO'. */
  IMPRESSAO_TERMINADA: number;
}

export type TipoImpressao = 'IMPRESSAO' | '2.VIA' | 'COPIA';

export const MSG = pt.documentos;

/** BR-DOC-16, in the Forms order. */
export const CANCELAR_ESTADOS = ['TERMINADO', 'ESPERA', 'ENQUEUED', 'EM EXECUCAO', 'ERRO'] as const;

/** Names the Forms clone dialog never lets the user set (block WHERE + the two fixed calls). */
export const PARAMETROS_RESERVADOS = ['P_ID', '_USER', 'P_USUARIO'] as const;

/**
 * A clone parameter name must be a plain identifier: PKG_DOCUMENTOS_SVR.EXECUTA_DOCUMENTO
 * concatenates every submitted name into a quoted IN list it runs with EXECUTE IMMEDIATE (it
 * escapes the values, not the names). Forms took the names from the document's own rows; the
 * API takes them from the request, so it filters them here. Checked after upper-casing.
 */
export const NOME_PARAMETRO_RE = /^[A-Z0-9_]{1,30}$/;

/** A-06: Forms read only ATRIBUTO9; ANULAR sets DISPONIVEL_RF. */
export const anulado = (d: DocOperacao): boolean => d.ATRIBUTO9 === 'A' || d.DISPONIVEL_RF === 'ANU';

/** BR-DOC-13: the CONFIRMAR_PASSWORD gate, decided over the whole selection (annulled included). */
export const precisaPassword = (docs: readonly DocOperacao[]): boolean =>
  docs.some((d) => d.IMPRESSAO_TERMINADA > 0 || d.MODO_EXPEDICAO_RF === 'G');

/** REIMPRIMIR.OK + program unit REIMPRIMIR; annulled skipped for all three types (D-28). */
export function motivoImpressao(tipo: TipoImpressao, d: DocOperacao): string | null {
  if (anulado(d)) return MSG.impressosAnulados;
  if (tipo === '2.VIA' && (d.N_IMPRESSOES ?? 0) === 0) return MSG.segundaViaSemImpressao;
  return null;
}

export const motivoRegerar = (d: DocOperacao): string | null => (anulado(d) ? MSG.regeradosAnulados : null);

/** BR-DOC-17: `modo` is the Forms DECODE result (W only when CAN_BE_UPLOADED_EDOC <> 0). */
export const motivoReenviarEdoc = (modo: string | null): string | null => (modo === 'W' ? null : MSG.reenviadosNaoEdoc);

/** D-05: server-side address check Forms lacked. */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const motivoReenviarEmail = (email: string | null): string | null =>
  email && EMAIL_RE.test(email) ? null : MSG.reenviadosNaoEmail;

/** REARQUIVAR button: `DECODE(NVL(ARQ_ID, 0), 0, 'N', 'S')` — null and 0 are both "no archive". */
export const motivoRearquivar = (d: DocOperacao): string | null => (d.ARQ_ID ? null : MSG.rearquivadosNaoArquivo);

/** ERR_ERROS_SIID.DESCRICAO, byte-exact as Forms wrote them (BR-DOC-36) except the D-28 fix. */
export const auditoria = {
  // Trailing space: program unit REGERAR builds `''DOCUMENTO REGERADO POR '|| user ||' ''` in FORMS_DDL.
  regerado: (user: string) => `DOCUMENTO REGERADO POR ${user} `,
  // D-28: Forms wrote REGERADO here.
  reenviado: (user: string) => `DOCUMENTO REENVIADO POR ${user}`,
  // No space before PARA: `'... POR '|| v_utilizador || 'PARA ' || V_EMAIL` in REENVIA_EMAIL.
  email: (user: string, email: string) => `DOCUMENTO REENVIADO POR EMAIL POR ${user}PARA ${email}`,
  arquivado: (user: string) => `DOCUMENTO ARQUIVADO POR ${user}`,
};

/** CLONAR.CLONAR as one anonymous block (D-17): names and values are binds, the text only depends on n. */
export function blocoClonar(n: number): string {
  const params = Array.from({ length: n }, (_, i) => `PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING(:n${i}, :v${i}); `).join('');
  return (
    `BEGIN ${params}PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO', :usuario); ` +
    "PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER', :ambiente); " +
    'PKG_DOCUMENTOS_SVR.EXECUTA(:modelo); :id := PKG_DOCUMENTOS_SVR.GET_ID_EXECUCAO; END;'
  );
}
