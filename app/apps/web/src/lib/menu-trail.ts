import { matchLeaf, menu, type MenuNode } from '@/menu';

export type BreadcrumbEntry = { label: string; to?: string };

/**
 * UI_SPEC §2.1: breadcrumb is "Grupo › Subgrupo › Item"; the page h1 is the item label, or
 * "<subgroup> · <item>" when the item sits under a second-level subgroup (Backups, Impressoras
 * Associadas). Both read off the same trail, so the join logic below covers both without
 * hardcoding any label.
 */
export function findMenuTrail(pathname: string): BreadcrumbEntry[] | null {
  const walk = (nodes: readonly MenuNode[], trail: BreadcrumbEntry[]): BreadcrumbEntry[] | null => {
    for (const node of nodes) {
      const entry: BreadcrumbEntry = { label: node.label, to: node.kind === 'item' ? node.to : undefined };
      const nextTrail = [...trail, entry];
      if (node.kind === 'item') {
        const m = matchLeaf(node.to, pathname);
        // A row's detail page (D-34): "Configuração › Modelos › D1.A5", the item linking back.
        if (m) return m.key === undefined ? nextTrail : [...nextTrail, { label: m.key }];
      } else {
        const found = walk(node.children, nextTrail);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(menu, []);
}

export function pageTitleFor(trail: BreadcrumbEntry[]): string {
  const labels = trail.map((e) => e.label);
  return labels.length > 2 ? labels.slice(-2).join(' · ') : (labels.at(-1) ?? '');
}
