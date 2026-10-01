import { describe, expect, it } from 'vitest';
import { findMenuTrail, pageTitleFor } from '@/lib/menu-trail';

describe('findMenuTrail', () => {
  it('a menu item: Grupo › Item', () => {
    expect(findMenuTrail('/configuracao/modelos')?.map((e) => e.label)).toEqual(['Configuração', 'Modelos']);
  });

  it("a row's detail page (D-34) appends the key, and the item links back to its list", () => {
    const trail = findMenuTrail('/configuracao/modelos/D1.A5')!;
    expect(trail.map((e) => e.label)).toEqual(['Configuração', 'Modelos', 'D1.A5']);
    expect(trail[1]?.to).toBe('/configuracao/modelos');
    expect(pageTitleFor(trail)).toBe('Modelos · D1.A5');
    expect(findMenuTrail('/administracao/dominios/TIPO%20X')?.at(-1)?.label).toBe('TIPO X');
  });

  it('does not treat a sibling that only shares a prefix as a detail page', () => {
    expect(findMenuTrail('/configuracao/impressoras-associadas/documento')?.map((e) => e.label)).toEqual([
      'Configuração',
      'Impressoras Associadas',
      'Documento',
    ]);
  });
});
