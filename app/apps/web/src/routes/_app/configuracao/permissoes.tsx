import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Tabs } from 'radix-ui';
import { toast } from 'sonner';
import {
  permissoes,
  PERMISSOES_DOMINIOS,
  pt,
  type ListQuery,
  type PagedResult,
  type Role,
} from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { useDominio } from '@/components/datablock/CellEditor';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { Picker } from '@/components/Picker';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { TransferList } from '@/components/TransferList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  dataIso,
  DateField,
  DialogForm,
  dmy,
  DominioSelect,
  inputCls,
  ReadField,
} from '@/components/DialogForm';

/**
 * Configuração › Permissões (UI_SPEC §4.4, MASTER_PLAN Step 5.4): `FD_PERMISSOES_SIID`.
 * Tabs = the form's tab pages GERAL / UTILIZADOR / MODELOS. Geral is the read-only grid over
 * CFG_PERMISSOES_SIID_VW with the popup-menu actions as toolbar dialogs; Utilizador and Modelos
 * are the CTR_USERS_SIID / CTR_MODELOS_SIID panels. Every write is a named route of
 * `apps/api/src/features/permissoes/routes.ts`. The panel transfers and Retirar Permissão are
 * optimistic (rolled back on error); the dialogs wait for the server, whose rule messages
 * (#31–#35) show inside the dialog.
 */
export const Route = createFileRoute('/_app/configuracao/permissoes')({
  component: PermissoesScreen,
});

// ── shared bits ────────────────────────────────────────────────────────────────────────────

interface Perm {
  MODELO_ID: string;
  USERNAME: string;
  UNIDADE_NEGOCIO_RF: string;
  TIPO_PERMISSAO_RF: number;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}
interface SemRow {
  MODELO_ID: string;
  USERNAME: string;
  NOME: string | null;
}
interface Painel {
  com: Perm[];
  sem: SemRow[];
}
interface Utilizador {
  USERNAME: string;
  NOME: string | null;
  UNIDADE_NEGOCIO_RF: string;
}
interface Modelo {
  ID: string;
}

const GRID: QueryKey = ['/permissoes'];
const PAINEL = 'permissoes-painel';
/** `TO_DATE('31-12-2200')`: DATA_FIM the panels give a new row (FIM_BULK in rules.ts). */
const FIM_BULK = '2200-12-31T00:00:00';
/** `01/01/1980`: DATA_FIM of a row annulled from the grid (FIM_ANULADA in rules.ts). */
const FIM_ANULADA = '1980-01-01T00:00:00';
const TODOS: ListQuery = { filters: {}, sort: [], page: 1, size: 500 };
const byKey = <T,>(k: keyof T) => (a: T, b: T) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0);

function hoje(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) + 'T00:00:00';
}

/** A picker opened from any dialog or panel; one of each kind lives at the screen root. */
type Pick =
  | { kind: 'modelo'; onPick: (m: Modelo) => void }
  | { kind: 'utilizador'; un?: string; onPick: (u: Utilizador) => void };
type OpenPick = (p: Pick) => void;

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: GRID });
    void qc.invalidateQueries({ queryKey: [PAINEL] });
  };
}

function useUnidade() {
  const un = useDominio(PERMISSOES_DOMINIOS.unidadeNegocio);
  return (code: string) => un.data?.find((o) => o.value === code)?.label ?? code;
}

// ── screen ─────────────────────────────────────────────────────────────────────────────────

function PermissoesScreen() {
  const { session } = Route.useRouteContext();
  const [pick, setPick] = useState<Pick | null>(null);
  const tabCls =
    '-mb-px border-b-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-foreground';
  const panelCls = 'min-h-0 flex-1 flex-col gap-3 pt-3 data-[state=active]:flex data-[state=inactive]:hidden';

  return (
    <main id="conteudo" className="flex h-dvh flex-col gap-3 bg-background p-4 text-foreground">
      <header>
        <h1 className="text-lg font-semibold">Permissões</h1>
      </header>

      <Tabs.Root defaultValue="geral" className="flex min-h-0 flex-1 flex-col">
        <Tabs.List aria-label="Permissões" className="flex gap-1 border-b border-border">
          <Tabs.Trigger value="geral" className={tabCls}>
            Geral
          </Tabs.Trigger>
          <Tabs.Trigger value="utilizador" className={tabCls}>
            Utilizador
          </Tabs.Trigger>
          <Tabs.Trigger value="modelos" className={tabCls}>
            Modelos
          </Tabs.Trigger>
        </Tabs.List>
        {/* forceMount: each tab keeps its controls and grid state while another is shown. */}
        <Tabs.Content value="geral" forceMount className={panelCls}>
          <Geral role={session.role} openPick={setPick} />
        </Tabs.Content>
        <Tabs.Content value="utilizador" forceMount className={panelCls}>
          <PainelPermissoes lado="utilizador" openPick={setPick} />
        </Tabs.Content>
        <Tabs.Content value="modelos" forceMount className={panelCls}>
          <PainelPermissoes lado="modelo" openPick={setPick} />
        </Tabs.Content>
      </Tabs.Root>

      <Picker<Modelo>
        open={pick?.kind === 'modelo'}
        onOpenChange={(o) => !o && setPick(null)}
        onSelect={(m) => pick?.kind === 'modelo' && pick.onPick(m)}
        title="Modelos"
        listLabel="Modelos"
        endpoint="/permissoes/modelos"
        query={TODOS}
        searchLabel="Pesquisar modelo"
        searchPlaceholder="Pesquisar por id"
        emptyLabel={pt.db.semRegistos}
        matches={(r, term) => r.ID.toUpperCase().includes(term)}
        keyOf={(r) => r.ID}
        renderOption={(r) => <span className="font-mono font-semibold">{r.ID}</span>}
      />
      <Picker<Utilizador>
        open={pick?.kind === 'utilizador'}
        onOpenChange={(o) => !o && setPick(null)}
        onSelect={(u) => pick?.kind === 'utilizador' && pick.onPick(u)}
        title="Utilizadores"
        listLabel="Utilizadores"
        endpoint={
          pick?.kind === 'utilizador' && pick.un
            ? `/permissoes/utilizadores?un=${encodeURIComponent(pick.un)}`
            : '/permissoes/utilizadores'
        }
        query={TODOS}
        searchLabel="Pesquisar utilizador"
        searchPlaceholder="Pesquisar por username ou nome"
        emptyLabel={pt.db.semRegistos}
        matches={(r, term) =>
          r.USERNAME.toUpperCase().includes(term) || (r.NOME ?? '').toUpperCase().includes(term)
        }
        keyOf={(r) => r.USERNAME}
        renderOption={(r) => (
          <>
            <span className="font-mono font-semibold">{r.USERNAME}</span>
            <span className="text-xs text-muted-foreground">
              {r.NOME} ({r.UNIDADE_NEGOCIO_RF})
            </span>
          </>
        )}
      />
    </main>
  );
}

// ── Geral ──────────────────────────────────────────────────────────────────────────────────

// The ten ORDENAR_PERMISSOES sort buttons become the ten sortable headers.
const columns: ColumnView<GridRow>[] = [
  { col: 'MODELO_ID', width: 104, mono: true },
  { col: 'USERNAME', width: 120, mono: true },
  { col: 'UNIDADE_NEGOCIO_RF', width: 80 },
  { col: 'TIPO_PERMISSAO', width: 160 },
  { col: 'DATA_INICIO', width: 116 },
  { col: 'DATA_FIM', width: 116 },
  { col: 'CRIADO_POR', width: 120 },
  { col: 'DATA_CRIACAO', width: 116 },
  { col: 'ACTUALIZADO_POR', width: 120 },
  { col: 'DATA_ACTUALIZACAO', width: 128 },
];

type Dlg = 'nova' | 'alterar' | 'copiar-modelo' | 'copiar-utilizador' | null;

function Geral({ role, openPick }: { role: Role; openPick: OpenPick }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const refresh = useRefresh();
  const [todos, setTodos] = useState(false);
  const [current, setCurrent] = useState<GridRow | null>(null);
  const [dlg, setDlg] = useState<Dlg>(null);
  const cur = current as (GridRow & Perm) | null;

  const done = () => {
    toast.success(pt.db.guardado);
    setDlg(null);
    refresh();
  };

  // Retirar Permissão (BR-PERM-06), optimistic: the row ends on 01-01-1980 at once (and leaves a
  // "valid today" list), and comes back if the server refuses.
  const retirar = async () => {
    if (!cur) return;
    const ok = await confirm({
      title: `Deseja anular a permissão do utilizador ${cur.USERNAME} para o documento ${cur.MODELO_ID}?`,
      kind: 'sim-nao',
      destructive: true,
    });
    if (ok !== true) return;
    const { _rid, ...orig } = cur;
    await qc.cancelQueries({ queryKey: GRID });
    const antes = qc.getQueriesData<PagedResult<GridRow>>({ queryKey: GRID });
    for (const [key, data] of antes) {
      if (!data) continue;
      const soValidas = (key[2] as ListQuery | undefined)?.preset === 'validas';
      const rows = soValidas
        ? data.rows.filter((r) => r._rid !== _rid)
        : data.rows.map((r) => (r._rid === _rid ? { ...r, DATA_FIM: FIM_ANULADA } : r));
      qc.setQueryData(key, { ...data, rows });
    }
    try {
      await apiFetch('/permissoes/anular', {
        method: 'POST',
        body: JSON.stringify({ orig: pickPerm(orig) }),
      });
      toast.success(pt.db.guardado);
    } catch {
      for (const [key, data] of antes) qc.setQueryData(key, data); // apiFetch toasted the error
    } finally {
      refresh();
    }
  };

  return (
    <>
      <DataBlock
        className="min-h-0 flex-1"
        heading="Permissões"
        resource={permissoes}
        columns={columns}
        role={role}
        edit="none"
        preset={todos ? undefined : 'validas'}
        onCurrentRowChange={setCurrent}
        toolbar={() => (
          <>
            <Button size="sm" variant={todos ? 'default' : 'outline'} aria-pressed={todos} onClick={() => setTodos(!todos)}>
              Todos
            </Button>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <Button size="sm" variant="outline" onClick={() => setDlg('nova')}>
              Adicionar Permissão
            </Button>
            <Button size="sm" variant="outline" disabled={!cur} onClick={() => setDlg('alterar')}>
              Alterar Validade
            </Button>
            <Button size="sm" variant="outline" disabled={!cur} onClick={() => void retirar()}>
              Retirar Permissão
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDlg('copiar-modelo')}>
              Copiar do modelo...
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDlg('copiar-utilizador')}>
              Copiar do utilizador...
            </Button>
          </>
        )}
      />

      <Dialog open={dlg !== null} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent className="sm:max-w-md">
          {dlg === 'nova' && <NovaForm openPick={openPick} onCancel={() => setDlg(null)} onDone={done} />}
          {dlg === 'alterar' && cur && <AlterarForm perm={cur} onCancel={() => setDlg(null)} onDone={done} />}
          {dlg === 'copiar-modelo' && (
            <CopiarModeloForm openPick={openPick} onCancel={() => setDlg(null)} onDone={done} />
          )}
          {dlg === 'copiar-utilizador' && (
            <CopiarUtilizadorForm openPick={openPick} onCancel={() => setDlg(null)} onDone={done} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const pickPerm = (r: Record<string, unknown>): Perm => ({
  MODELO_ID: String(r['MODELO_ID']),
  USERNAME: String(r['USERNAME']),
  UNIDADE_NEGOCIO_RF: String(r['UNIDADE_NEGOCIO_RF']),
  TIPO_PERMISSAO_RF: Number(r['TIPO_PERMISSAO_RF']),
  DATA_INICIO: String(r['DATA_INICIO']),
  DATA_FIM: (r['DATA_FIM'] as string | null) ?? null,
});

// ── dialogs ────────────────────────────────────────────────────────────────────────────────

interface FormProps {
  onCancel: () => void;
  onDone: () => void;
}

function PickField({ label, value, onOpen }: { label: string; value: string | null; onOpen: () => void }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-center gap-2 text-sm">
      <span>{label}</span>
      <Button
        type="button"
        variant="outline"
        className="justify-start font-mono"
        aria-label={`${label}: ${value ?? 'Escolher…'}`}
        onClick={onOpen}
      >
        {value ?? <span className="font-sans text-muted-foreground">Escolher…</span>}
      </Button>
    </div>
  );
}

function TipoSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="grid grid-cols-[8rem_1fr] items-center gap-2 text-sm">
      {label}
      <DominioSelect dominioId={PERMISSOES_DOMINIOS.tipo} value={value} onChange={onChange} />
    </label>
  );
}

/** Both dates; throws the field's message when one is unreadable. */
function datas(ini: string, fim: string) {
  const i = dataIso(ini);
  const f = dataIso(fim);
  if (i === false) throw new Error('Início Validade: Data inválida.');
  if (f === false) throw new Error('Fim Validade: Data inválida.');
  return { DATA_INICIO: i ?? '', DATA_FIM: f };
}

const post = (path: string, body: unknown, method = 'POST') =>
  apiFetch(path, { method, body: JSON.stringify(body) }, { quiet: true });

function NovaForm({ openPick, onCancel, onDone }: FormProps & { openPick: OpenPick }) {
  const unidade = useUnidade();
  const [modelo, setModelo] = useState<string | null>(null);
  const [user, setUser] = useState<Utilizador | null>(null);
  const [tipo, setTipo] = useState('');
  const [ini, setIni] = useState('');
  const [fim, setFim] = useState('');
  return (
    <DialogForm
      title="Adicionar Permissão"
      onCancel={onCancel}
      submit={async () => {
        await post('/permissoes', {
          MODELO_ID: modelo ?? undefined,
          USERNAME: user?.USERNAME,
          UNIDADE_NEGOCIO_RF: user?.UNIDADE_NEGOCIO_RF,
          TIPO_PERMISSAO_RF: tipo === '' ? undefined : Number(tipo),
          ...datas(ini, fim),
        });
        onDone();
      }}
    >
      <PickField label="Modelo" value={modelo} onOpen={() => openPick({ kind: 'modelo', onPick: (m) => setModelo(m.ID) })} />
      <PickField
        label="Utilizador"
        value={user?.USERNAME ?? null}
        onOpen={() => openPick({ kind: 'utilizador', onPick: setUser })}
      />
      <ReadField label="Depart." value={user ? unidade(user.UNIDADE_NEGOCIO_RF) : ''} />
      <TipoSelect label="Tipo Permissão" value={tipo} onChange={setTipo} />
      <DateField label="Início Validade" value={ini} onChange={setIni} />
      <DateField label="Fim Validade" value={fim} onChange={setFim} />
    </DialogForm>
  );
}

function AlterarForm({ perm, onCancel, onDone }: FormProps & { perm: GridRow & Perm }) {
  const unidade = useUnidade();
  const [ini, setIni] = useState(dmy(perm.DATA_INICIO));
  const [fim, setFim] = useState(dmy(perm.DATA_FIM));
  return (
    <DialogForm
      title="Alterar Validade"
      onCancel={onCancel}
      submit={async () => {
        await post('/permissoes', { orig: pickPerm(perm), values: datas(ini, fim) }, 'PUT');
        onDone();
      }}
    >
      <ReadField label="Modelo" value={perm.MODELO_ID} />
      <ReadField label="Utilizador" value={perm.USERNAME} />
      <ReadField label="Depart." value={unidade(perm.UNIDADE_NEGOCIO_RF)} />
      <ReadField label="Tipo Permissão" value={String(perm['TIPO_PERMISSAO'] ?? perm.TIPO_PERMISSAO_RF)} />
      <DateField label="Início Validade" value={ini} onChange={setIni} />
      <DateField label="Fim Validade" value={fim} onChange={setFim} />
    </DialogForm>
  );
}

function CopiarModeloForm({ openPick, onCancel, onDone }: FormProps & { openPick: OpenPick }) {
  const [alvo, setAlvo] = useState<string | null>(null);
  const [origem, setOrigem] = useState<string | null>(null);
  return (
    <DialogForm
      title="Copiar do modelo..."
      onCancel={onCancel}
      canSubmit={alvo !== null && origem !== null}
      submit={async () => {
        await post('/permissoes/copiar-modelo', { MODELO_ID: alvo, MODELO_ID_COPIAR: origem });
        onDone();
      }}
    >
      <PickField label="Modelo" value={alvo} onOpen={() => openPick({ kind: 'modelo', onPick: (m) => setAlvo(m.ID) })} />
      <PickField
        label="Copiar do modelo"
        value={origem}
        onOpen={() => openPick({ kind: 'modelo', onPick: (m) => setOrigem(m.ID) })}
      />
    </DialogForm>
  );
}

function CopiarUtilizadorForm({ openPick, onCancel, onDone }: FormProps & { openPick: OpenPick }) {
  const unidade = useUnidade();
  const [alvo, setAlvo] = useState<Utilizador | null>(null);
  const [origem, setOrigem] = useState<Utilizador | null>(null);
  return (
    <DialogForm
      title="Copiar do utilizador..."
      onCancel={onCancel}
      canSubmit={alvo !== null && origem !== null}
      submit={async () => {
        await post('/permissoes/copiar-utilizador', {
          USERNAME: alvo?.USERNAME,
          UNIDADE_NEGOCIO_RF: alvo?.UNIDADE_NEGOCIO_RF,
          USERNAME_COPIAR: origem?.USERNAME,
          UNIDADE_NEGOCIO_RF_COPIAR: origem?.UNIDADE_NEGOCIO_RF,
        });
        onDone();
      }}
    >
      <PickField
        label="Utilizador"
        value={alvo?.USERNAME ?? null}
        onOpen={() => openPick({ kind: 'utilizador', onPick: setAlvo })}
      />
      <ReadField label="Depart." value={alvo ? unidade(alvo.UNIDADE_NEGOCIO_RF) : ''} />
      <PickField
        label="Copiar do utilizador"
        value={origem?.USERNAME ?? null}
        onOpen={() => openPick({ kind: 'utilizador', onPick: setOrigem })}
      />
      <ReadField label="Depart. (origem)" value={origem ? unidade(origem.UNIDADE_NEGOCIO_RF) : ''} />
    </DialogForm>
  );
}

// ── Utilizador / Modelos panels ────────────────────────────────────────────────────────────

/**
 * CTR_USERS_SIID (`lado="utilizador"`: one user, lists of models) and its mirror CTR_MODELOS_SIID
 * (`lado="modelo"`: one model, lists of users). Buttons stay off until Departamento, the
 * user/model and Permissão are all set. Each transfer is applied to the lists at once and undone
 * if the server refuses it.
 */
function PainelPermissoes({ lado, openPick }: { lado: 'utilizador' | 'modelo'; openPick: OpenPick }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const refresh = useRefresh();
  const [un, setUn] = useState('DSI'); // the list item's initial value
  const [fixo, setFixo] = useState<string | null>(null);
  const [tipo, setTipo] = useState('');
  const [busy, setBusy] = useState(false);

  const livre = lado === 'utilizador' ? 'MODELO_ID' : 'USERNAME';
  const base = `/permissoes/por-${lado}/${encodeURIComponent(fixo ?? '')}`;
  const key = [PAINEL, lado, fixo, un, tipo];
  const ready = fixo !== null && un !== '' && tipo !== '';
  const painel = useQuery({
    queryKey: key,
    queryFn: () => apiFetch<Painel>(`${base}?un=${encodeURIComponent(un)}&tipo=${tipo}`),
    enabled: ready,
  });
  const dados: Painel = ready && painel.data ? painel.data : { com: [], sem: [] };
  // One row valid today per user/model in a scope (TRG_PREVENT_DUPLICATE_PERM), so the free column
  // alone is the key: a selection survives the refetch that replaces an optimistic row.
  const comKey = (p: Perm) => p[livre];

  const enviar = async (acao: string, body: object, otimista: (p: Painel) => Painel) => {
    await qc.cancelQueries({ queryKey: key });
    const antes = qc.getQueryData<Painel>(key);
    if (antes) qc.setQueryData(key, otimista(antes));
    setBusy(true);
    try {
      await apiFetch(`${base}/${acao}`, {
        method: 'POST',
        body: JSON.stringify({ un, tipo: Number(tipo), ...body }),
      });
      toast.success(pt.db.guardado);
    } catch {
      if (antes) qc.setQueryData(key, antes); // apiFetch toasted the error
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const onAdd = (keys: string[] | 'todos') => {
    const escolhidos = new Set(keys === 'todos' ? dados.sem.map((s) => s[livre]) : keys);
    const passa = (p: Painel): Painel => {
      const move = p.sem.filter((s) => escolhidos.has(s[livre]));
      const novos = move.map((s) => ({
        MODELO_ID: s.MODELO_ID,
        USERNAME: s.USERNAME,
        UNIDADE_NEGOCIO_RF: un,
        TIPO_PERMISSAO_RF: Number(tipo),
        DATA_INICIO: hoje(),
        DATA_FIM: FIM_BULK,
      }));
      return {
        sem: p.sem.filter((s) => !escolhidos.has(s[livre])),
        com: [...p.com, ...novos].sort(byKey<Perm>(livre)),
      };
    };
    if (keys === 'todos') void enviar('add-all', {}, passa);
    else void enviar('add', { [lado === 'utilizador' ? 'modelos' : 'utilizadores']: keys }, passa);
  };

  const onRemove = async (keys: string[] | 'todos') => {
    const linhas = keys === 'todos' ? dados.com : dados.com.filter((c) => keys.includes(comKey(c)));
    if (keys === 'todos') {
      const ok = await confirm({
        title: `Retirar as ${linhas.length} permissões?`,
        kind: 'sim-nao',
        destructive: true,
      });
      if (ok !== true) return;
    }
    const sai = new Set(linhas.map(comKey));
    const passa = (p: Painel): Painel => ({
      com: p.com.filter((c) => !sai.has(comKey(c))),
      sem: [
        ...p.sem,
        ...p.com.filter((c) => sai.has(comKey(c))).map((c) => ({ MODELO_ID: c.MODELO_ID, USERNAME: c.USERNAME, NOME: null })),
      ].sort(byKey<SemRow>(livre)),
    });
    if (keys === 'todos') void enviar('remove-all', {}, passa);
    else
      void enviar('remove', { linhas: linhas.map((l) => ({ [livre]: l[livre], DATA_INICIO: l.DATA_INICIO })) }, passa);
  };

  const rotulo = lado === 'utilizador' ? 'Modelo' : 'Username';
  const datasCols = [
    { label: 'Data Inicio', value: (p: Perm) => dmy(p.DATA_INICIO) },
    { label: 'Data Fim', value: (p: Perm) => dmy(p.DATA_FIM) },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Departamento
          <DominioSelect
            dominioId={PERMISSOES_DOMINIOS.unidadeNegocio}
            value={un}
            onChange={(v) => {
              setUn(v);
              if (lado === 'utilizador') setFixo(null); // WHEN-LIST-CHANGED: UTILIZADOR := NULL
            }}
            className={`${inputCls} min-w-48`}
          />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span aria-hidden="true">{lado === 'utilizador' ? 'Utilizador' : 'Modelo'}</span>
          <Button
            type="button"
            variant="outline"
            className="min-w-40 justify-start font-mono"
            aria-label={`${lado === 'utilizador' ? 'Utilizador' : 'Modelo'}: ${fixo ?? 'Escolher…'}`}
            disabled={lado === 'utilizador' && un === ''}
            onClick={() =>
              openPick(
                lado === 'utilizador'
                  ? { kind: 'utilizador', un, onPick: (u) => setFixo(u.USERNAME) }
                  : { kind: 'modelo', onPick: (m) => setFixo(m.ID) },
              )
            }
          >
            {fixo ?? <span className="font-sans text-muted-foreground">Escolher…</span>}
          </Button>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Permissão
          <DominioSelect
            dominioId={PERMISSOES_DOMINIOS.tipo}
            value={tipo}
            onChange={setTipo}
            className={`${inputCls} min-w-48`}
          />
        </label>
      </div>

      {painel.isError && ready && (
        <p role="alert" className="text-sm text-danger-text">
          Falha no Carregamento !!
        </p>
      )}

      <TransferList<SemRow, Perm>
        left={{
          title: 'Sem Permissão',
          columns: [{ label: rotulo, value: (s) => s[livre], mono: true }],
          rows: dados.sem,
          keyOf: (s) => s[livre],
        }}
        right={{
          title: 'Com Permissão',
          columns: [{ label: rotulo, value: (p) => p[livre], mono: true }, ...datasCols],
          rows: dados.com,
          keyOf: comKey,
        }}
        onAdd={onAdd}
        onRemove={(k) => void onRemove(k)}
        // Also while fetching: an optimistic row's DATA_INICIO is a guess the server would refuse.
        disabled={!ready || busy || painel.isFetching}
        loading={ready && painel.isPending}
      />
    </>
  );
}
