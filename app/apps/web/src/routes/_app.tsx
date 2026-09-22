import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/shell/app-shell';
import { sessionQueryOptions } from '@/auth/session';

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
  return (
    <AppShell session={session}>
      <Outlet />
    </AppShell>
  );
}
