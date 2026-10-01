import { pt } from '@gestsiid/shared';
import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { AppShell } from '@/components/shell/app-shell';
import { sessionQueryOptions } from '@/auth/session';
import { menuItemFor } from '@/menu';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    try {
      const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
      return { session };
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { session } = Route.useRouteContext();
  const { pathname } = useLocation();
  // A typed URL reaches screens the menu hides (D-08); the API still decides (403), this only
  // stops the screen from rendering and firing requests that are bound to fail.
  const item = menuItemFor(pathname);
  const allowed = !item || item.roles.includes(session.role);
  return (
    <AppShell session={session}>
      {allowed ? <Outlet /> : <p role="alert" className="text-sm text-muted-foreground">{pt.semPermissao}</p>}
    </AppShell>
  );
}
