import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { createMemoryHistory, createRootRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@/auth/session';
import { AppShell } from '@/components/shell/app-shell';

const ADM_SESSION: Session = { username: 'MSILVA', nome: 'Maria Silva', role: 'ADM', ambiente: 'GADOR_TESTES' };
const USER_SESSION: Session = { username: 'JCOSTA', nome: 'João Costa', role: 'USER', ambiente: 'GADOR_TESTES' };

function renderShellAt(pathname: string, session: Session) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell session={session}>
        <Outlet />
      </AppShell>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true, ambiente: 'GADOR_TESTES', db: { ok: true } }), { status: 200 }),
      ),
    );
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders the top bar with the signed-in user and the breadcrumb/title for the current route', async () => {
    renderShellAt('/gestao/documentos', ADM_SESSION);

    expect(await screen.findByText('Maria Silva (MSILVA)')).toBeTruthy();
    expect(screen.getByText('Administrador')).toBeTruthy();
    expect(screen.getAllByText('Documentos').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1, name: 'Documentos' })).toBeTruthy();
  });

  it('shows ADM-only menu groups for an ADM session', async () => {
    renderShellAt('/gestao/documentos', ADM_SESSION);

    const nav = await screen.findByRole('navigation', { name: 'Menu' });
    expect(within(nav).getByText('Configuração')).toBeTruthy();
    expect(within(nav).getByText('Administração')).toBeTruthy();
  });

  it('hides every ADM-only menu group for a USER session', async () => {
    renderShellAt('/gestao/documentos', USER_SESSION);

    const nav = await screen.findByRole('navigation', { name: 'Menu' });
    expect(within(nav).getByText('Documentos')).toBeTruthy();
    expect(within(nav).queryByText('Configuração')).toBeNull();
    expect(within(nav).queryByText('Administração')).toBeNull();
    expect(within(nav).queryByText('Gador')).toBeNull();
  });
});
