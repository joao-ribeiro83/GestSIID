import { Link } from '@tanstack/react-router';
import type { BreadcrumbEntry } from '@/lib/menu-trail';

export function Breadcrumb({ trail }: { trail: BreadcrumbEntry[] }) {
  return (
    <nav aria-label="Localização" className="text-xs text-muted-foreground">
      <ol className="flex items-center gap-1">
        {trail.map((entry, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={entry.label} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">›</span>}
              {isLast || !entry.to ? (
                <span aria-current={isLast ? 'page' : undefined}>{entry.label}</span>
              ) : (
                <Link to={entry.to} className="hover:text-foreground">
                  {entry.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
