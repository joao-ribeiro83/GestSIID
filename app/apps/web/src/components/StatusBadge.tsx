import { cn } from '@/lib/utils';

/** UI_SPEC §6.3: document state (`SVR_DOCUMENTOS_VW.ESTADO`) or queue state (`SVR_QUEUE.ESTADO`). */
export type StatusDomain = 'documento' | 'fila';
type Tone = 'pending' | 'running' | 'success' | 'danger' | 'neutral';

const DOCUMENTO: Record<string, Tone> = Object.fromEntries([
  ...['WAIT', 'EXECUCAO', 'WAIT REENV', 'WAIT 2.VIA', 'WAIT EMAIL', 'WAIT ENVIO', 'WAIT COPIA', 'WAIT IMP',
    'WAIT XML', 'WAIT ARQUIVO', 'REENVIO', '2.VIA', 'EMAIL', 'ENVIO', 'COPIA', 'IMPRESSAO', 'Preparar XML',
    'ARQUIVO'].map((v) => [v, 'pending']),
  ...['A EXECUTAR', 'A REENVIAR', 'A IMPRIMIR', 'SENDING', 'A ENVIAR', 'A COPIAR', 'A criar XML',
    'A ARQUIVAR'].map((v) => [v, 'running']),
  ...['GERADO', 'REENVIADO', 'IMPRESSO', 'EMAIL SENT', 'ENVIADO', 'COPIADO', 'XML CRIADO',
    'ARQUIVADO'].map((v) => [v, 'success']),
  ['ERRO', 'danger'],
]);

const FILA: Record<string, Tone> = {
  ESPERA: 'pending',
  ENQUEUED: 'pending',
  EXECUCAO: 'running',
  'EM EXECUCAO': 'running',
  TERMINADO: 'success',
  ERRO: 'danger',
  CANCELLED: 'neutral',
  SUSPENSO: 'neutral',
};

const PRIMEIRA: Record<string, Tone> = {
  ESPERA: 'pending',
  ENQUEUED: 'pending',
  ENQUEED: 'pending',
  EXECUCAO: 'running',
  EM: 'running',
  TERMINADO: 'success',
  ERRO: 'danger',
  CANCELLED: 'neutral',
  SUSPENSO: 'neutral',
};

/** Exact table, then the first-word rule for composite `<ESTADO> <TIPO>` values, else neutral. */
export function tomDe(value: string, domain: StatusDomain): Tone {
  const exact = (domain === 'documento' ? DOCUMENTO : FILA)[value];
  return exact ?? PRIMEIRA[value.split(' ')[0] ?? ''] ?? 'neutral';
}

const CLS: Record<Tone, string> = {
  pending: 'bg-status-pending-bg text-status-pending-fg',
  running: 'bg-status-running-bg text-status-running-fg',
  success: 'bg-status-success-bg text-status-success-fg',
  danger: 'bg-status-danger-bg text-status-danger-fg',
  neutral: 'bg-status-neutral-bg text-status-neutral-fg',
};

export function StatusBadge({ value, domain }: { value: unknown; domain: StatusDomain }) {
  if (value == null || value === '') {
    return domain === 'documento' ? (
      <span className="text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">Não executado</span>
      </span>
    ) : null;
  }
  const text = String(value);
  return (
    <span
      className={cn(
        'inline-flex h-5 max-w-full items-center truncate rounded-sm px-1.5 text-xs font-semibold',
        CLS[tomDe(text, domain)],
      )}
    >
      {text}
    </span>
  );
}
