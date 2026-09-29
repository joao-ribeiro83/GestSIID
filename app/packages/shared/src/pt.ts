/**
 * Portuguese string catalogue (ARCHITECTURE.md §8): the full BUSINESS_RULES.md §3 numbered
 * catalogue, error texts, menu labels and confirm-dialog labels land here as they're needed by
 * each feature. Empty beyond the common labels and one worked example for now — a message with
 * values, e.g. the skipped-document ids a batch action reports, is a function, not a string.
 */
export const pt = {
  sim: 'Sim',
  nao: 'Não',
  ok: 'OK',
  cancelar: 'Cancelar',

  /** D-26: shown when a batch action is requested with no selection. */
  naoExistemDocumentosSeleccionados: 'Não existem documentos seleccionados.',

  /** ARCHITECTURE.md §5: login field validation. */
  utilizadorObrigatorio: "O 'Utilizador' é de preenchimento obrigatório.",
  passwordObrigatoria: "A 'Password' é de preenchimento obrigatório.",
  /** BUSINESS_RULES.md §3 #3 (LOGIN_INVALIDO). */
  loginInvalido: 'Utilizador e/ou password inválidos.',
  /** §3 #6 (FD_ALTERAR_PASSWORD). */
  passwordsNaoCoincidem: 'As passwords não coincidem. Alteração não efectuada.',
  /** §3 #15 (PASSWORD_ERRADA, FD_GESTAO_SIID). */
  passwordErrada: 'A password inserida está errada.',
  /** ARCHITECTURE.md §8 error table. */
  sessaoExpirada: 'A sessão expirou. Entre novamente.',
  semPermissao: 'Não tem permissão para esta operação.',
  csrfInvalido: 'Pedido inválido. Recarregue a página.',

  /** BUSINESS_RULES.md §3 #46 (AskCommitDialog). */
  desejaGravar: 'Deseja gravar as alterações efectuadas?',

  /** DataBlock (UI_SPEC §2.8 `db.*`). */
  db: {
    registo: (i: number, total: string, capped: boolean) =>
      capped ? `Registo ${i} de mais de 10 000` : `Registo ${i} de ${total}`,
    registos: (total: number, fmt: string, capped: boolean) =>
      capped ? 'Mais de 10 000 registos' : total === 1 ? '1 registo' : `${fmt} registos`,
    seleccionados: (n: number) => `${n} seleccionado(s)`,
    todosSeleccionados: (total: string, capped: boolean) =>
      capped
        ? 'Todos os registos da consulta estão seleccionados (mais de 10 000).'
        : `Todos os ${total} registos da consulta estão seleccionados.`,
    seleccionarTodos: 'Seleccionar todos',
    seleccionarRegisto: 'Seleccionar registo',
    limparSeleccao: 'Limpar selecção',
    maxSeleccao:
      'Máximo de 1000 registos seleccionados. Use «Seleccionar todos» para a consulta completa.',
    limparFiltros: 'Limpar filtros',
    filtrosPendentes: 'Filtros alterados. Prima Enter para consultar.',
    ajudaFiltros: 'Ajuda dos filtros',
    ajudaLinhas: [
      'Texto: valor exacto; use % (vários caracteres) e _ (um carácter).',
      'Número e código: valor exacto.',
      'Data: DD-MM-AAAA, ou intervalo DD-MM-AAAA..DD-MM-AAAA (um dos lados pode ficar vazio).',
      'IS NULL / IS NOT NULL: registos sem valor / com valor.',
    ],
    numeroInvalido: 'Valor numérico inválido.',
    dataInvalida: 'Data inválida. Use DD-MM-AAAA.',
    campoObrigatorio: 'Campo obrigatório.',
    semRegistos: 'Não existem registos.',
    consultaSemRegistos: 'A consulta não obteve registos.',
    seleccioneRegisto: 'Seleccione um registo.',
    pagina: 'Página',
    de: (n: string, capped: boolean) => (capped ? `de ${n}+` : `de ${n}`),
    porPagina: 'Por página',
    primeira: 'Primeira página',
    anterior: 'Página anterior',
    seguinte: 'Página seguinte',
    ultima: 'Última página',
    alteracoes: ({
      novos,
      alterados,
      apagados,
    }: {
      novos: number;
      alterados: number;
      apagados: number;
    }) =>
      [
        novos && `${novos} ${novos === 1 ? 'novo' : 'novos'}`,
        alterados && `${alterados} ${alterados === 1 ? 'alterado' : 'alterados'}`,
        apagados && `${apagados} ${apagados === 1 ? 'apagado' : 'apagados'}`,
      ]
        .filter(Boolean)
        .join(' · '),
    alteracoesRegiao: 'Alterações por guardar',
    erroNoRegisto: (n: number | string, msg: string) => `Erro no registo ${n}: ${msg}`,
    estado: {
      novo: 'Novo',
      alterado: 'Alterado',
      apagado: 'Apagado',
      aGuardar: 'A guardar',
      erro: 'Erro',
      conflito: 'Bloqueado',
    },
    actualizar: 'Actualizar',
    guardar: 'Guardar',
    novo: 'Novo',
    apagar: 'Apagar',
    ordenarAsc: 'Ordenar ascendente',
    ordenarDesc: 'Ordenar descendente',
    removerOrdenacao: 'Remover ordenação',
    guardado: 'Guardado.',
    guardeMestre: 'Guarde o registo principal antes de adicionar detalhes.',
    todos: 'Todos',
  },

  erro: {
    ref: (id: string) => `Ref.: ${id}`,
    tentarNovamente: 'Tentar novamente',
  },

  /** Example text-with-values function (§8). */
  naoImpressosAnulados: (ids: number[]): string =>
    `Os seguintes documentos não foram impressos por estarem anulados: ${ids.join(', ')}`,
} as const;
