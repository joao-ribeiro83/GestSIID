import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { ConfirmDialogProvider } from '@/components/shell/confirm-dialog-provider';
import { Toaster } from '@/components/ui/sonner';

export type RouterContext = { queryClient: QueryClient };

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ConfirmDialogProvider>
      <Outlet />
      <Toaster />
    </ConfirmDialogProvider>
  );
}
