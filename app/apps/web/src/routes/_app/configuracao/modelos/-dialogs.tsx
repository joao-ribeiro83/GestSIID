import { useState } from 'react';
import { modelos, MODELOS_DOMINIOS, pt } from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { lockOrig, type GridRow } from '@/components/datablock/dirty';
import {
  dataIso,
  DateField,
  DialogForm,
  dmy,
  ReadField,
  SelectField,
  TextField,
} from '@/components/DialogForm';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { enc } from './-common';

/**
 * The form's dialog canvases EDITAR_MODELO (window title "Alterar Modelo" or "Clonar Modelo") and
 * EDITAR_CODIGO_BARRAS. Alterar and Código Barras save through `PUT /api/modelos/:rid` with their
 * own column subset (BR-MOD-02 / BR-MOD-12); Clonar is `POST …/acoes/clonar` (BR-MOD-03).
 */

interface Props {
  modelo: GridRow;
  onCancel: () => void;
  onDone: () => void;
}

const txt = (v: unknown) => (v == null ? '' : String(v));

function numero(label: string, text: string, required = false): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '') {
    if (required) throw new Error(`${label}: ${pt.db.campoObrigatorio}`);
    return null;
  }
  const n = Number(t);
  if (!Number.isFinite(n)) throw new Error(`${label}: ${pt.db.numeroInvalido}`);
  return n;
}

function data(label: string, text: string, required = false): string | null {
  const v = dataIso(text);
  if (v === false) throw new Error(`${label}: ${pt.db.dataInvalida}`);
  if (v === null && required) throw new Error(`${label}: ${pt.db.campoObrigatorio}`);
  return v;
}

function texto(label: string, text: string): string {
  if (text.trim() === '') throw new Error(`${label}: ${pt.db.campoObrigatorio}`);
  return text.trim();
}

const put = (modelo: GridRow, values: Record<string, unknown>) =>
  apiFetch(
    `/modelos/${modelo._rid}`,
    { method: 'PUT', body: JSON.stringify({ orig: lockOrig(modelos, modelo), values }) },
    { quiet: true },
  );

/** "Alterar Modelo" (`clonar` false) or "Clonar Modelo" (a new reference, from this model). */
export function ModeloForm({ modelo, clonar, onCancel, onDone }: Props & { clonar?: boolean }) {
  const confirm = useConfirm();
  const [id, setId] = useState(clonar ? '' : txt(modelo['ID']));
  const [descricao, setDescricao] = useState(txt(modelo['DESCRICAO']));
  const [copias, setCopias] = useState(txt(modelo['N_COPIAS']));
  const [unicidade, setUnicidade] = useState(txt(modelo['FORMA_CONTROLO_RF']));
  const [inicio, setInicio] = useState(dmy(modelo['DATA_INICIO'] as string | null));
  const [fim, setFim] = useState(dmy(modelo['DATA_FIM'] as string | null));

  const submit = async () => {
    const values = {
      DESCRICAO: texto('Descrição', descricao),
      N_COPIAS: numero('Nº de Cópias', copias, true),
      FORMA_CONTROLO_RF: texto('Unicidade', unicidade),
      DATA_INICIO: data('Validade', inicio, true),
      DATA_FIM: data('Data Fim', fim),
    };
    if (!clonar) {
      await put(modelo, values);
      return onDone();
    }
    const ID = texto('Modelo', id);
    const ok = await confirm({
      title: 'Clonar',
      description: 'Esta operação é irreversível. Quer criar um novo modelo à semelhança do existente?',
      kind: 'sim-nao',
    });
    if (ok !== true) return;
    await apiFetch(
      `/modelos/${enc(modelo['ID'])}/acoes/clonar`,
      { method: 'POST', body: JSON.stringify({ ID, ...values }) },
      { quiet: true },
    );
    onDone();
  };

  return (
    <DialogForm title={clonar ? 'Clonar Modelo' : 'Alterar Modelo'} onCancel={onCancel} submit={submit}>
      {clonar ? (
        <TextField label="Modelo" value={id} onChange={setId} maxLength={10} required autoFocus />
      ) : (
        <ReadField label="Modelo" value={id} />
      )}
      <TextField label="Descrição" value={descricao} onChange={setDescricao} maxLength={240} required />
      <TextField label="Nº de Cópias" value={copias} onChange={setCopias} inputMode="numeric" required />
      <SelectField
        label="Unicidade"
        dominioId={MODELOS_DOMINIOS.formaControlo}
        value={unicidade}
        onChange={setUnicidade}
        required
      />
      <DateField label="Validade" value={inicio} onChange={setInicio} />
      <DateField label="Data Fim" value={fim} onChange={setFim} />
    </DialogForm>
  );
}

/** "Código Barras": where and how the barcode is stamped on the document (BR-MOD-12). */
export function CodigoBarrasForm({ modelo, onCancel, onDone }: Props) {
  const [tipo, setTipo] = useState(txt(modelo['BARCODE_TYPE']));
  const [altura, setAltura] = useState(txt(modelo['BARCODE_HEIGHT']));
  const [largura, setLargura] = useState(txt(modelo['BARCODE_WEIGHT']));
  const [x, setX] = useState(txt(modelo['BARCODE_X_POSITION']));
  const [y, setY] = useState(txt(modelo['BARCODE_Y_POSITION']));
  const [formato, setFormato] = useState(txt(modelo['BARCODE_FORMAT']));

  const submit = async () => {
    await put(modelo, {
      BARCODE_TYPE: tipo || null,
      BARCODE_HEIGHT: numero('Altura (cm)', altura),
      BARCODE_WEIGHT: numero('Largura (cm)', largura),
      BARCODE_X_POSITION: numero('Posição X', x),
      BARCODE_Y_POSITION: numero('Posição Y', y),
      BARCODE_FORMAT: formato.trim() || null,
    });
    onDone();
  };

  return (
    <DialogForm title="Código Barras" onCancel={onCancel} submit={submit}>
      <ReadField label="Modelo" value={txt(modelo['ID'])} />
      <SelectField
        label="Tipo de código de barras"
        dominioId={MODELOS_DOMINIOS.codigosBarras}
        value={tipo}
        onChange={setTipo}
      />
      <TextField label="Altura (cm)" value={altura} onChange={setAltura} inputMode="decimal" />
      <TextField label="Largura (cm)" value={largura} onChange={setLargura} inputMode="decimal" />
      <TextField label="Posição X" value={x} onChange={setX} inputMode="decimal" />
      <TextField label="Posição Y" value={y} onChange={setY} inputMode="decimal" />
      <p className="pl-[8.5rem] text-xs text-muted-foreground">
        (Origem do documento é o canto superior esquerdo e medida em cm)
      </p>
      <TextField label="Formato" value={formato} onChange={setFormato} maxLength={240} />
    </DialogForm>
  );
}
