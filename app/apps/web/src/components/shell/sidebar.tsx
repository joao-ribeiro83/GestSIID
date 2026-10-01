import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronDown, FileText, Settings2, Users, Wrench, type LucideIcon } from 'lucide-react';
import type { Role } from '@gestsiid/shared';
import { menuFor, type MenuNode } from '@/menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/** §2.1: one icon per top-level group, used both in the expanded header and the collapsed rail. */
const GROUP_ICONS: Record<string, LucideIcon> = {
  gestao: FileText,
  gador: Users,
  configuracao: Settings2,
  administracao: Wrench,
};

function containsPath(node: MenuNode, pathname: string): boolean {
  if (node.kind === 'item') return node.to === pathname;
  return node.children.some((child) => containsPath(child, pathname));
}

function MenuNodeView({
  node,
  pathname,
  depth,
  forceOpenId,
}: {
  node: MenuNode;
  pathname: string;
  depth: number;
  forceOpenId: string | null;
}) {
  if (node.kind === 'item') {
    const active = node.to === pathname;
    return (
      <Link
        to={node.to}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex h-8 items-center rounded-md pr-3 text-sm transition-colors',
          depth > 1 ? 'pl-6' : 'pl-3',
          active
            ? 'border-l-2 border-sidebar-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent',
        )}
      >
        {node.label}
      </Link>
    );
  }

  return <MenuGroupView node={node} pathname={pathname} depth={depth} forceOpenId={forceOpenId} />;
}

function MenuGroupView({
  node,
  pathname,
  depth,
  forceOpenId,
}: {
  node: Exclude<MenuNode, { kind: 'item' }>;
  pathname: string;
  depth: number;
  forceOpenId: string | null;
}) {
  const active = containsPath(node, pathname);
  const [open, setOpen] = useState(active);
  // Open the group when the route enters it or the collapsed rail asks for it (adjusting state
  // during render, not in an effect: https://react.dev/learn/you-might-not-need-an-effect).
  const trigger = `${active}|${forceOpenId}`;
  const [lastTrigger, setLastTrigger] = useState(trigger);
  if (trigger !== lastTrigger) {
    setLastTrigger(trigger);
    if (active || node.id === forceOpenId) setOpen(true);
  }
  const Icon = depth === 0 ? GROUP_ICONS[node.id] : undefined;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex h-8 w-full items-center gap-2 rounded-md pl-3 pr-3 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent">
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        <span className="flex-1 text-left">{node.label}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-0.5 py-0.5">
        {node.children.map((child) => (
          <MenuNodeView key={child.id} node={child} pathname={pathname} depth={depth + 1} forceOpenId={forceOpenId} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export type SidebarProps = {
  role: Role;
  pathname: string;
  collapsed: boolean;
  forceOpenId: string | null;
  onExpandGroup: (groupId: string) => void;
};

export function Sidebar({ role, pathname, collapsed, forceOpenId, onExpandGroup }: SidebarProps) {
  const items = menuFor(role);

  if (collapsed) {
    return (
      <nav aria-label="Menu" className="flex w-12 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-2">
        {items.map((node) => {
          const Icon = GROUP_ICONS[node.id] ?? FileText;
          return (
            <button
              key={node.id}
              type="button"
              aria-label={node.label}
              onClick={() => onExpandGroup(node.id)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Menu"
      className="flex w-60 flex-col gap-0.5 overflow-y-auto border-r border-sidebar-border bg-sidebar p-2"
    >
      {items.map((node) => (
        <MenuNodeView key={node.id} node={node} pathname={pathname} depth={0} forceOpenId={forceOpenId} />
      ))}
    </nav>
  );
}
