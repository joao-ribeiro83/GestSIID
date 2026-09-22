/**
 * ORA/NJS/DPI → AppError mapping (ARCHITECTURE.md §8 error table). The raw driver message is
 * kept on `oraCode` for pino logging only; the client-facing `message` is always the fixed
 * Portuguese catalogue text, except ORA-20000..20999 (a package's own RAISE_APPLICATION_ERROR),
 * whose first line the client is meant to see.
 */

export interface AppErrorOptions {
  fields?: Record<string, string>;
  oraCode?: string;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields?: Record<string, string>;
  readonly oraCode?: string;

  constructor(statusCode: number, code: string, message: string, options?: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = options?.fields;
    this.oraCode = options?.oraCode;
  }
}

interface MappedError {
  statusCode: number;
  code: string;
  message: string;
}

const ORA_MAP: Record<number, MappedError> = {
  1400: { statusCode: 400, code: 'ORA_01400', message: 'Campo obrigatório não preenchido.' },
  1407: { statusCode: 400, code: 'ORA_01400', message: 'Campo obrigatório não preenchido.' },
  12899: { statusCode: 400, code: 'ORA_12899', message: 'Valor demasiado grande para o campo.' },
  1438: { statusCode: 400, code: 'ORA_12899', message: 'Valor demasiado grande para o campo.' },
  54: {
    statusCode: 409,
    code: 'REGISTO_BLOQUEADO',
    message: 'O registo está bloqueado por outro utilizador. Tente novamente.',
  },
  30006: {
    statusCode: 409,
    code: 'REGISTO_BLOQUEADO',
    message: 'O registo está bloqueado por outro utilizador. Tente novamente.',
  },
  1: { statusCode: 409, code: 'ORA_00001', message: 'Já existe um registo com estes valores.' },
  2292: {
    statusCode: 409,
    code: 'ORA_02292',
    message: 'Impossível apagar registo mestre se existirem registos de detalhe correspondentes.',
  },
  2291: { statusCode: 422, code: 'ORA_02291', message: 'Valor não existe na tabela de referência.' },
  2290: { statusCode: 422, code: 'ORA_02290', message: 'Valor não permitido.' },
  1013: { statusCode: 504, code: 'TEMPO_ESGOTADO', message: 'A operação excedeu o tempo limite.' },
};

const BD_INDISPONIVEL: MappedError = {
  statusCode: 503,
  code: 'BD_INDISPONIVEL',
  message: 'Base de dados indisponível. Tente mais tarde.',
};

for (const code of [3113, 3114, 3135, 12154, 12170, 12514, 12541, 12545]) {
  ORA_MAP[code] = BD_INDISPONIVEL;
}

const NJS_MAP: Record<number, MappedError> = {
  40: BD_INDISPONIVEL,
  500: BD_INDISPONIVEL,
  503: BD_INDISPONIVEL,
};

const DPI_MAP: Record<number, MappedError> = {
  1067: { statusCode: 504, code: 'TEMPO_ESGOTADO', message: 'A operação excedeu o tempo limite.' },
};

const ERRO_FALLBACK: MappedError = { statusCode: 500, code: 'ERRO', message: 'Erro' };

/** Maps a raw error thrown by node-oracledb to the fixed Portuguese {@link AppError} catalogue. */
export function mapOracleError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);

  const oraMatch = /ORA-(\d+)/.exec(message);
  if (oraMatch) {
    const num = Number(oraMatch[1]);
    const oraCode = oraMatch[0];

    if (num >= 20000 && num <= 20999) {
      const firstLine = message.split('\n')[0] ?? message;
      return new AppError(422, 'ORA_20XXX', firstLine, { oraCode });
    }

    const mapped = ORA_MAP[num] ?? ERRO_FALLBACK;
    return new AppError(mapped.statusCode, mapped.code, mapped.message, { oraCode });
  }

  const njsMatch = /NJS-(\d+)/.exec(message);
  if (njsMatch) {
    const mapped = NJS_MAP[Number(njsMatch[1])] ?? ERRO_FALLBACK;
    return new AppError(mapped.statusCode, mapped.code, mapped.message, { oraCode: njsMatch[0] });
  }

  const dpiMatch = /DPI-(\d+)/.exec(message);
  if (dpiMatch) {
    const mapped = DPI_MAP[Number(dpiMatch[1])] ?? ERRO_FALLBACK;
    return new AppError(mapped.statusCode, mapped.code, mapped.message, { oraCode: dpiMatch[0] });
  }

  return new AppError(ERRO_FALLBACK.statusCode, ERRO_FALLBACK.code, ERRO_FALLBACK.message);
}
