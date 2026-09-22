import { useNavigate } from '@tanstack/react-router';
import { PanelLeft } from 'lucide-react';
import type { Session } from '@/auth/session';
import { apiFetch } from '@/api/client';
import { queryClient } from '@/api/query-client';
import { useDensidade, useTema } from '@/lib/preferences';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnvironmentBadge } from '@/components/shell/environment-badge';

const ROLE_LABEL: Record<Session['role'], string> = { ADM: 'Administrador', USER: 'Utilizador' };

export function TopBar({
  session,
  collapsed,
  onToggleCollapsed,
}: {
  session: Session;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [escuro, setEscuro] = useTema();
  const [confortavel, setConfortavel] = useDensidade();
  const navigate = useNavigate();

  async function sair() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      queryClient.clear();
      void navigate({ to: '/login' });
    }
  }

  return (
    <header className="flex h-11 items-center gap-3 border-b border-sidebar-border bg-sidebar px-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        onClick={onToggleCollapsed}
      >
        <PanelLeft className="size-4" />
      </Button>
      <span className="text-sm font-semibold">GestSIID</span>
      <EnvironmentBadge />
      <DropdownMenu>
        <DropdownMenuTrigger className="ml-auto flex items-center gap-2 rounded-md px-2 py-1 text-right hover:bg-sidebar-accent">
          <span className="flex flex-col leading-tight">
            <span className="text-sm">
              {session.nome} ({session.username})
            </span>
            <span className="text-xs text-muted-foreground">{ROLE_LABEL[session.role]}</span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-between gap-4 px-2 py-1.5 text-sm">
            <label htmlFor="tema-escuro">Tema escuro</label>
            <Switch id="tema-escuro" checked={escuro} onCheckedChange={setEscuro} />
          </div>
          <div className="flex items-center justify-between gap-4 px-2 py-1.5 text-sm">
            <label htmlFor="densidade-confortavel">Densidade confortável</label>
            <Switch id="densidade-confortavel" checked={confortavel} onCheckedChange={setConfortavel} />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void sair()}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
