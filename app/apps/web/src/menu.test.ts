import { describe, expect, it } from 'vitest';
import { menuFor } from '@/menu';

describe('menuFor', () => {
  it('gives ADM every group except the always-empty Auditoria (D-06)', () => {
    const groups = menuFor('ADM').map((n) => n.id);
    expect(groups).toEqual(['gestao', 'gador', 'configuracao', 'administracao']);
  });

  it('gives ADM both Backups leaves and both Impressoras Associadas leaves', () => {
    const [gestao] = menuFor('ADM');
    expect(gestao?.kind).toBe('group');
    if (gestao?.kind !== 'group') throw new Error('unreachable');
    const backups = gestao.children.find((n) => n.id === 'backups');
    expect(backups?.kind).toBe('group');
    if (backups?.kind !== 'group') throw new Error('unreachable');
    expect(backups.children.map((n) => n.id)).toEqual(['backup-novo', 'backups-online']);
  });

  it('gives USER only Gestão › Documentos (D-08); every ADM-only group is pruned away', () => {
    const groups = menuFor('USER');
    expect(groups.map((n) => n.id)).toEqual(['gestao']);
    const [gestao] = groups;
    if (gestao?.kind !== 'group') throw new Error('unreachable');
    expect(gestao.children.map((n) => n.id)).toEqual(['documentos']);
  });
});
