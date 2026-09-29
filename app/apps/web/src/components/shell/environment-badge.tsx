import { useHealth } from '@/api/health';
import { cn } from '@/lib/utils';

/** UI-25 / BR-XC-07: amber solid badge whenever `ambiente` contains "TESTE"; quiet outline otherwise. */
export function EnvironmentBadge() {
  const { data } = useHealth();
  const ambiente = data?.ambiente;
  const isTeste = ambiente?.toUpperCase().includes('TESTE') ?? false;

  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-sm px-1.5 text-xs font-semibold',
        isTeste
          ? 'bg-env-test-bg text-env-test-fg'
          : 'border border-env-prod-border bg-env-prod-bg text-env-prod-fg',
      )}
    >
      {ambiente ?? '—'}
    </span>
  );
}
