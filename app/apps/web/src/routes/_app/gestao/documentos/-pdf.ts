import { toast } from 'sonner';
import { apiUrl } from '@/api/client';

/** Mostrar Documento: the window opens inside the click (no popup blocker), the PDF follows. */
export async function mostrarDocumento(id: number) {
  const w = window.open('', '_blank');
  try {
    const res = await fetch(apiUrl(`/documentos/${id}/pdf`), { credentials: 'same-origin' });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? 'Documento não disponível.');
    }
    const url = URL.createObjectURL(await res.blob());
    if (w) w.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    w?.close();
    toast.error((e as Error).message);
  }
}
