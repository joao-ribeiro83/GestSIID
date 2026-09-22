import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useHealth } from '@/api/health';
import type { Session } from '@/auth/session';
import { findMenuTrail, pageTitleFor } from '@/lib/menu-trail';
import { useMediaQuery } from '@/lib/use-media-query';
import { useMenuRecolhido } from '@/lib/preferences';
import { TopBar } from '@/components/shell/top-bar';
import { Sidebar } from '@/components/shell/sidebar';
import { Breadcrumb } from '@/components/shell/breadcrumb';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

/** §2.1 breakpoints: below 1280 the rail auto-collapses (unless expanded this session); below 1024 it's an off-canvas Sheet. */
export function AppShell({ session, children }: { session: Session; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: health } = useHealth();
  const trail = findMenuTrail(pathname) ?? [];
  const title = trail.length ? pageTitleFor(trail) : 'GestSIID';

  const isBelowXl = useMediaQuery('(max-width: 1279px)');
  const isBelowLg = useMediaQuery('(max-width: 1023px)');
  const [persistedCollapsed, setPersistedCollapsed] = useMenuRecolhido();
  const [sessionExpanded, setSessionExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [forceOpenId, setForceOpenId] = useState<string | null>(null);

  const collapsed = !isBelowLg && (persistedCollapsed || (isBelowXl && !sessionExpanded));

  function toggleCollapsed() {
    if (isBelowLg) {
      setMobileOpen((open) => !open);
      return;
    }
    if (collapsed) {
      if (isBelowXl) setSessionExpanded(true);
      else setPersistedCollapsed(false);
    } else if (isBelowXl) {
      setSessionExpanded(false);
    } else {
      setPersistedCollapsed(true);
    }
  }

  function expandGroup(groupId: string) {
    setForceOpenId(groupId);
    if (isBelowXl) setSessionExpanded(true);
    else setPersistedCollapsed(false);
  }

  const h1Ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    h1Ref.current?.focus();
  }, [pathname]);

  useEffect(() => {
    document.title = health?.ambiente ? `${title} · GestSIID · ${health.ambiente}` : `${title} · GestSIID`;
  }, [title, health?.ambiente]);

  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[80] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Saltar para o conteúdo
      </a>
      <TopBar session={session} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      {health && !health.ok && (
        <div role="alert" className="border-b border-border bg-status-danger-bg px-4 py-1.5 text-sm text-status-danger-fg">
          Base de dados indisponível. Tente mais tarde.
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        {isBelowLg ? (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-2">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Sidebar
                role={session.role}
                pathname={pathname}
                collapsed={false}
                forceOpenId={forceOpenId}
                onExpandGroup={expandGroup}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <Sidebar
            role={session.role}
            pathname={pathname}
            collapsed={collapsed}
            forceOpenId={forceOpenId}
            onExpandGroup={expandGroup}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-1 border-b border-border px-4 py-2">
            <Breadcrumb trail={trail} />
            <h1 ref={h1Ref} tabIndex={-1} className="text-lg font-semibold outline-none">
              {title}
            </h1>
          </div>
          <main id="conteudo" className="flex-1 px-4 py-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
