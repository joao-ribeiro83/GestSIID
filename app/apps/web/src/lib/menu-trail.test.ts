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

  // Regression: PR #13 review — a malformed escape threw a URIError while the shell rendered, and a
  // trailing slash turned the list into an empty "detail" crumb.
  it('keeps a malformed escape as typed and ignores a trailing slash', () => {
    expect(findMenuTrail('/configuracao/modelos/%E0%A4')?.at(-1)?.label).toBe('%E0%A4');
    expect(findMenuTrail('/configuracao/modelos/')?.map((e) => e.label)).toEqual(['Configuração', 'Modelos']);
  });

  it('does not treat a sibling that only shares a prefix as a detail page', () => {
    expect(findMenuTrail('/configuracao/impressoras-associadas/documento')?.map((e) => e.label)).toEqual([
      'Configuração',
      'Impressoras Associadas',
      'Documento',
    ]);
  });
});
