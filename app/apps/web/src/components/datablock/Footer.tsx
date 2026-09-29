import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { pt } from '@gestsiid/shared';
import { Button } from '@/components/ui/button';
import { formatNumber } from './format';

const SIZES = [25, 50, 100, 250, 500];

interface Props {
  counter: string;
  page: number;
  pageCount: number;
  capped: boolean;
  /** The current page came back full (for `›` when the total is capped). */
  pageFull: boolean;
  size: number;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}

/** Record counter + server paging (§3.6). */
export function Footer({
  counter,
  page,
  pageCount,
  capped,
  pageFull,
  size,
  onPage,
  onSize,
}: Props) {
  const [typed, setTyped] = useState<string | null>(null);
  const canNext = capped ? pageFull : page < pageCount;
  const go = (n: number) => onPage(Math.min(Math.max(1, n), capped ? n : pageCount));

  return (
    <div className="flex h-8 shrink-0 items-center gap-3 border-t border-border px-3 text-xs">
      <span aria-live="polite" className="min-w-0 flex-1 truncate">
        {counter}
      </span>
      <label className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="hidden sm:inline">{pt.db.porPagina}</span>
        <select
          aria-label={pt.db.porPagina}
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
          className="h-6 rounded-sm border border-input bg-background px-1"
        >
          {SIZES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <nav aria-label="Paginação" className="inline-flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          aria-label={pt.db.primeira}
          disabled={page <= 1}
          onClick={() => go(1)}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={pt.db.anterior}
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <label className="inline-flex items-center gap-1 whitespace-nowrap px-1">
          <span className="hidden sm:inline">{pt.db.pagina}</span>
          <input
            aria-label={pt.db.pagina}
            value={typed ?? String(page)}
            onChange={(e) => setTyped(e.target.value.replace(/\D/g, ''))}
            onBlur={() => setTyped(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && typed) {
                go(Number(typed));
                setTyped(null);
              }
            }}
            className="h-6 w-10 rounded-sm border border-input bg-background px-1 text-right tabular-nums"
          />
          {pt.db.de(formatNumber(pageCount), capped)}
        </label>
        <Button
          variant="ghost"
          size="sm"
          aria-label={pt.db.seguinte}
          disabled={!canNext}
          onClick={() => go(page + 1)}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={pt.db.ultima}
          disabled={capped || page >= pageCount}
          onClick={() => go(pageCount)}
        >
          <ChevronsRight />
        </Button>
      </nav>
    </div>
  );
}
