import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderScreen } from '@/components/shell/placeholder-screen';

export const Route = createFileRoute('/_app/configuracao/permissoes')({
  component: PlaceholderScreen,
});
