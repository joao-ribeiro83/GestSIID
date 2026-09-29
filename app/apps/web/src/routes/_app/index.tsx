import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/')({
  component: () => <p className="text-sm text-muted-foreground">Bem-vindo ao GestSIID.</p>,
});
