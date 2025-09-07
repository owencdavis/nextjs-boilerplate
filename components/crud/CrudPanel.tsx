// components/crud/CrudPanel.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button, Empty, Input, SectionCard, Select, Textarea, Toolbar } from '@/components/ui';

type FieldKind = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'fk' | 'tags' | 'money' | 'date';

export type FieldConfig = {
  key: string;                // column in table
  label: string;              // UI label
  kind: FieldKind;
  required?: boolean;
  // for select
  options?: Array<{ value: string; label: string }>;
  // for fk
  fk?: { table: string; valueKey: string; labelKey: string; orderBy?: string };
  // list-only formatting
  listFormat?: (val: any, row: any) => string;
  // default value
  default?: any;
  // hide in list view
  hideInList?: boolean;
};

export type CrudConfig = {
  title: string;
  subtitle?: string;
  table: string;
  listSelect?: string;     // select(...) clause; defaults to '*'
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  fields: FieldConfig[];
  searchKeys?: string[];
  // optional transform before save
  beforeSave?: (payload: any, isUpdate: boolean) => any;
  // optional row title in list
  listTitle?: (row: any) => string;
  // key columns to show in list (falls back to visible fields)
  listCols?: string[];
};

export default function CrudPanel(config: CrudConfig) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [query, setQuery] = useState('');

  const selectClause = config.listSelect || '*';

  async function load() {
    setLoading(true);
    let req = supabase.from(config.table).select(selectClause);
    if (config.orderBy) req = req.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true });
    if (config.limit) req = req.limit(config.limit);
    const { data, error } = await req;
    if (error) alert(`Load ${config.title} failed: ` + error.message);
    setRows((data || []) as any[]);
    setLoading(false);
  }

  // FK options cache
  const [fkOptions, setFkOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  async function loadFkOptions() {
    const needs = config.fields.filter((f) => f.kind === 'fk' && f.fk);
    const map: Record<string, { value: string; label: string }[]> = {};
    for (const f of needs) {
      const fk = f.fk!;
      let req = supabase.from(fk.table).select(`${fk.valueKey}, ${fk.labelKey}`);
      if (fk.orderBy) req = req.order(fk.orderBy);
      const { data, error } = await req;
      if (!error && data) {
        map[f.key] = data.map((r: any) => ({ value: r[fk.valueKey], label: r[fk.labelKey] }));
      }
    }
    setFkOptions(map);
  }

  useEffect(() => {
    load();
    loadFkOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return rows;
    const keys = config.searchKeys && config.searchKeys.length ? config.searchKeys : config.fields.map((f) => f.key);
    return rows.filter((row) => keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
  }, [rows, query, config]);

  function DefaultForm({ initial, onSaved, onCancel }: { initial?: any; onSaved: (r: any) => void; onCancel?: () => void }) {
    const [form, setForm] = useState<any>(() => {
      const base: any = {};
      for (const f of config.fields) {
        base[f.key] = f.key in (initial || {}) ? initial![f.key] : f.default ?? (f.kind === 'checkbox' ? false : (f.kind === 'tags' ? [] : ''));
      }
      // Preserve id if editing
      if (initial?.id) base.id = initial.id;
      return base;
    });
    const [saving, setSaving] = useState(false);

    function setField(key: string, val: any) {
      setForm((old: any) => ({ ...old, [key]: val }));
    }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSaving(true);
      let payload: any = {};
      for (const f of config.fields) {
        let v = form[f.key];
        if (f.kind === 'number' || f.kind === 'money') {
          v = v === '' || v === null || typeof v === 'undefined' ? null : Number(v);
        } else if (f.kind === 'tags') {
          v = Array.isArray(v) ? v : String(v).split(',').map((s) => s.trim()).filter(Boolean);
        } else if (f.kind === 'checkbox') {
          v = !!v;
        } else if (f.kind === 'date') {
          v = v || null;
        } else if (f.kind === 'fk' || f.kind === 'select' || f.kind === 'text' || f.kind === 'textarea') {
          v = v === '' ? null : v;
        }
        payload[f.key] = v;
      }
      if (config.beforeSave) payload = config.beforeSave(payload, !!form.id);

      try {
        let result;
        if (form.id) {
          result = await supabase.from(config.table).update(payload).eq('id', form.id).select(selectClause).single();
        } else {
          result = await supabase.from(config.table).insert(payload).select(selectClause).single();
        }
        if (result.error) throw result.error;
        onSaved(result.data);
      } catch (err: any) {
        alert(`${config.title} save failed: ${err?.message || String(err)}`);
      } finally {
        setSaving(false);
      }
    }

    return (
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.fields.map((f) => {
          const val = form[f.key];
          if (f.kind === 'text' || f.kind === 'number' || f.kind === 'money' || f.kind === 'date') {
            const type = f.kind === 'number' ? 'number' : f.kind === 'money' ? 'number' : f.kind === 'date' ? 'date' : 'text';
            const step = f.kind === 'money' ? '0.01' : undefined;
            return (
              <Input
                key={f.key}
                label={f.label}
                required={f.required}
                value={val ?? ''}
                type={type as any}
                step={step as any}
                onChange={(e) => setField(f.key, e.target.value)}
                className={f.hideInList ? 'md:col-span-2' : ''}
              />
            );
          }
          if (f.kind === 'textarea') {
            return <Textarea key={f.key} label={f.label} value={val ?? ''} onChange={(e) => setField(f.key, e.target.value)} className="md:col-span-2" />;
          }
          if (f.kind === 'checkbox') {
            return (
              <label key={f.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!val} onChange={(e) => setField(f.key, e.target.checked)} /> {f.label}
              </label>
            );
          }
          if (f.kind === 'select') {
            return (
              <Select key={f.key} label={f.label} value={val ?? ''} onChange={(e) => setField(f.key, e.target.value)} required={f.required}>
                <option value="" disabled>
                  Select…
                </option>
                {(f.options || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            );
          }
          if (f.kind === 'fk') {
            const opts = fkOptions[f.key] || [];
            return (
              <Select key={f.key} label={f.label} value={val ?? ''} onChange={(e) => setField(f.key, e.target.value)} required={f.required}>
                <option value="" disabled>
                  Select…
                </option>
                {opts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            );
          }
          if (f.kind === 'tags') {
            return (
              <Input
                key={f.key}
                label={f.label + ' (comma separated)'}
                value={Array.isArray(val) ? val.join(', ') : (val ?? '')}
                onChange={(e) => setField(f.key, e.target.value)}
                className="md:col-span-2"
              />
            );
          }
          return null;
        })}

        <div className="md:col-span-2 flex items-center justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={saving}>{form.id ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    );
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete this ${config.title.replace(/s$/, '').toLowerCase()}?`)) return;
    const { error } = await supabase.from(config.table).delete().eq('id', id);
    if (error) return alert('Delete failed: ' + error.message);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const visibleFields = config.fields.filter((f) => !f.hideInList);
  const listCols = config.listCols?.length ? config.listCols : visibleFields.map((f) => f.key);

  const [addingOpen, setAddingOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);

  return (
    <SectionCard title={config.title} subtitle={config.subtitle}>
      <Toolbar>
        <Button onClick={() => { setAddingOpen(true); setEditingRow(null); }}>+ New</Button>
        <Input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button variant="ghost" onClick={load}>Refresh</Button>
      </Toolbar>

      {addingOpen && (
        <div className="mb-6 border rounded-xl p-4 bg-emerald-50 border-emerald-200">
          <DefaultForm
            onSaved={(r) => {
              setAddingOpen(false);
              setRows((prev) => [r, ...prev]);
            }}
            onCancel={() => setAddingOpen(false)}
          />
        </div>
      )}

      {editingRow && (
        <div className="mb-6 border rounded-xl p-4 bg-amber-50 border-amber-200">
          <DefaultForm
            initial={editingRow}
            onSaved={(r) => {
              setEditingRow(null);
              setRows((prev) => prev.map((x) => (x.id === r.id ? r : x)));
            }}
            onCancel={() => setEditingRow(null)}
          />
        </div>
      )}

      {loading ? (
        <Empty message={`Loading ${config.title.toLowerCase()}…`} />
      ) : filtered.length === 0 ? (
        <Empty message={query ? 'No results for your search.' : `No ${config.title.toLowerCase()} yet.`} />
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                {listCols.map((k) => (
                  <th key={k} className="py-2 pr-4">
                    {config.fields.find((f) => f.key === k)?.label || k}
                  </th>
                ))}
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t">
                  {listCols.map((k) => {
                    const f = config.fields.find((ff) => ff.key === k)!;
                    const raw = row[k];
                    const text = f.listFormat ? f.listFormat(raw, row) : (raw ?? '—');
                    return (
                      <td key={k} className="py-2 pr-4">
                        {String(text ?? '—')}
                      </td>
                    );
                  })}
                  <td className="py-2 pr-4 text-right">
                    <Button variant="ghost" onClick={() => setEditingRow(row)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

