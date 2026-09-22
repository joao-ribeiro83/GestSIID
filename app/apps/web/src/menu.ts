import type { Role } from '@gestsiid/shared';

export type MenuItem = { kind: 'item'; id: string; label: string; to: string; form: string; roles: readonly Role[] };
export type MenuGroup = { kind: 'group'; id: string; label: string; children: readonly MenuNode[] };
export type MenuNode = MenuItem | MenuGroup;

const ADM = ['ADM'] as const;
const TODOS = ['ADM', 'USER'] as const;

export const menu: readonly MenuNode[] = [
  { kind: 'group', id: 'gestao', label: 'Gestão', children: [
    { kind: 'item', id: 'documentos', label: 'Documentos', to: '/gestao/documentos', form: 'FD_GESTAO_SIID', roles: TODOS },
    { kind: 'group', id: 'backups', label: 'Backups', children: [
      { kind: 'item', id: 'backup-novo', label: 'Novo', to: '/gestao/backups/novo', form: 'FD_NOVO_BACKUP', roles: ADM },
      { kind: 'item', id: 'backups-online', label: 'Backups Online', to: '/gestao/backups/online', form: 'FD_BACKUPS_ONLINE', roles: ADM },
    ] },
  ] },
  { kind: 'group', id: 'gador', label: 'Gador', children: [
    { kind: 'item', id: 'equipa-gestao', label: 'Equipa de Gestão (OD68)', to: '/gador/equipa-gestao', form: 'FD_PERFIS_DEPARTAMENTO', roles: ADM },
  ] },
  { kind: 'group', id: 'configuracao', label: 'Configuração', children: [
    { kind: 'item', id: 'reports', label: 'Reports', to: '/configuracao/reports', form: 'FD_CONFIGURACAO_REPORTS', roles: ADM },
    { kind: 'item', id: 'modelos', label: 'Modelos', to: '/configuracao/modelos', form: 'FD_CONFIGURACAO_MODELOS', roles: ADM },
    { kind: 'item', id: 'permissoes', label: 'Permissões', to: '/configuracao/permissoes', form: 'FD_PERMISSOES_SIID', roles: ADM },
    { kind: 'item', id: 'impressoras', label: 'Impressoras', to: '/configuracao/impressoras', form: 'FD_IMPRESSORAS_SIID', roles: ADM },
    { kind: 'group', id: 'impressoras-associadas', label: 'Impressoras Associadas', children: [
      { kind: 'item', id: 'imp-documento', label: 'Documento', to: '/configuracao/impressoras-associadas/documento', form: 'FD_GESTAO_IMPRESSORAS_DOC', roles: ADM },
      { kind: 'item', id: 'imp-utilizador', label: 'Utilizador', to: '/configuracao/impressoras-associadas/utilizador', form: 'FD_GESTAO_IMPRESSORAS_USR', roles: ADM },
    ] },
    { kind: 'item', id: 'alterar-password', label: 'Alterar password', to: '/configuracao/alterar-password', form: 'FD_ALTERAR_PASSWORD', roles: ADM },
  ] },
  { kind: 'group', id: 'administracao', label: 'Administração', children: [
    { kind: 'item', id: 'dominios', label: 'Domínios', to: '/administracao/dominios', form: 'FD_DOMINIOS_SIID', roles: ADM },
    { kind: 'item', id: 'unidades-medida', label: 'Unidades Medida', to: '/administracao/unidades-medida', form: 'FD_UNIDADES_MEDIDA', roles: ADM },
    { kind: 'item', id: 'tipos-midia', label: 'Tipos Mídia', to: '/administracao/tipos-midia', form: 'FD_TIPOS_MiDIA', roles: ADM },
    { kind: 'item', id: 'utilizadores', label: 'Utilizadores', to: '/administracao/utilizadores', form: 'FD_UTILIZADORES_SIID', roles: ADM },
    { kind: 'item', id: 'variaveis', label: 'Variáveis SIID', to: '/administracao/variaveis', form: 'FD_VARIAVEIS_SIID', roles: ADM },
  ] },
  { kind: 'group', id: 'auditoria', label: 'Auditoria', children: [] }, // D-06: no items, never rendered
];

/** Removes items the role may not see, then groups left empty. */
export function menuFor(role: Role): MenuNode[] {
  const prune = (n: MenuNode): MenuNode | null => {
    if (n.kind === 'item') return n.roles.includes(role) ? n : null;
    const children = n.children.map(prune).filter((c): c is MenuNode => c !== null);
    return children.length ? { ...n, children } : null;
  };
  return menu.map(prune).filter((n): n is MenuNode => n !== null);
}
