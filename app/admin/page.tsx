'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';
import Image from 'next/image';

/**
 * SmartStyle Admin Page (Next.js App Router)
 * -----------------------------------------
 * Adds Supabase Auth gate with:
 *  - Email magic-link sign-in
 *  - Simple employee allowlist via env (emails or domain)
 *
 * ENV (required):
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * ENV (optional):
 *  - NEXT_PUBLIC_EMPLOYEE_EMAILS="wendy@example.com, ops@smartstyle.ai"
 *  - NEXT_PUBLIC_EMPLOYEE_DOMAIN="smartstyle.ai"
 */

// ---------- Supabase Client (browser) ----------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------- Allowlist helpers ----------
const ALLOWLIST_EMAILS = (process.env.NEXT_PUBLIC_EMPLOYEE_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const ALLOWLIST_DOMAIN = (process.env.NEXT_PUBLIC_EMPLOYEE_DOMAIN || '').trim().toLowerCase();

function isAllowed(user: User | null): boolean {
  if (!user?.email) return false;
  const email = user.email.toLowerCase();
  if (ALLOWLIST_EMAILS.includes(email)) return true;
  if (ALLOWLIST_DOMAIN && email.endsWith(`@${ALLOWLIST_DOMAIN}`)) return true;
  // If no allowlist configured, default to allow (use RLS for true enforcement)
  if (!ALLOWLIST_EMAILS.length && !ALLOWLIST_DOMAIN) return true;
  return false;
}

// ---------- Types (matching the provided SQL schema) ----------
type UUID = string;

type Vendor = {
  id: UUID;
  name: string;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  wholesale: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type Product = {
  id: UUID;
  vendor_id: UUID;
  name: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  target_gender: 'womens' | 'mens' | 'unisex' | 'kids' | 'unknown';
  material: string | null;
  care: string | null;
  base_color: string | null;
  msrp: number | null;
  currency: string | null;
  external_handle: string | null;
  search_tags: string[];
  created_at?: string;
  updated_at?: string;
  vendor?: Vendor; // joined
};

type Persona = {
  id: UUID;
  display_name: string;
};

type Outfit = {
  id: UUID;
  persona_id: UUID;
  title: string;
  notes: string | null;
  persona?: Persona; // joined
};

// ---------- UI Helpers ----------
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl border border-slate-200 p-5 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>;
}

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm';
  const styles: Record<string, string> = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50',
    ghost: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block text-sm mb-3">
      {label && <span className="block text-slate-600 mb-1">{label}</span>}
      <input
        {...props}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${
          props.className || ''
        }`}
      />
    </label>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block text-sm mb-3">
      {label && <span className="block text-slate-600 mb-1">{label}</span>}
      <textarea
        {...props}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[90px] ${
          props.className || ''
        }`}
      />
    </label>
  );
}

function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block text-sm mb-3">
      {label && <span className="block text-slate-600 mb-1">{label}</span>}
      <select
        {...props}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${
          props.className || ''
        }`}
      >
        {children}
      </select>
    </label>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center text-slate-500 py-8">
      <p>{message}</p>
    </div>
  );
}

// ---------- Auth UI ----------
function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session once and subscribe to changes
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) setSession(data.session ?? null);
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user ?? null);
      setChecking(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      alert('Check your email for the sign-in link.');
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed');
    } finally {
      setSending(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const allowed = isAllowed(user);

  if (checking) {
    return (
      <main className="min-h-dvh bg-[#f0faf7] grid place-items-center">
        <div className="text-slate-500">Checking authentication…</div>
      </main>
    );
  }

  if (!session || !allowed) {
    return (
      <main className="min-h-dvh bg-[#f0faf7]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <header className="glass rounded-2xl border border-emerald-200 shadow-sm bg-white/70 backdrop-blur-sm p-4 sm:p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/wendy_logo.png" alt="Wendy Davis Logo" width={40} height={40} className="h-9 w-auto" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800">SmartStyle Admin</h1>
                <p className="text-slate-500 text-sm">Employees only — sign in to continue</p>
              </div>
            </div>
          </header>

          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Sign in</h2>
              <p className="text-sm text-slate-500 mb-4">
                Use your work email{ALLOWLIST_DOMAIN ? ` (@${ALLOWLIST_DOMAIN})` : ''}.
              </p>

              <form onSubmit={signInWithMagicLink} className="space-y-3">
                <Input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <Button type="submit" disabled={sending}>
                  {sending ? 'Sending link…' : 'Send magic link'}
                </Button>
              </form>

              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

              {session && !allowed && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  Your account (<span className="font-medium">{user?.email}</span>) isn’t on the allowlist.
                  Please contact an admin.
                  <div className="mt-3">
                    <Button variant="ghost" onClick={signOut}>Switch account</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <footer className="mt-10 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} SmartStyle — Admin
          </footer>
        </div>
      </main>
    );
  }

  // Authenticated & allowed → render children with a Sign Out control in header slot.
  return <>{children}</>;
}

// ---------- Vendors CRUD ----------
function VendorForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<Vendor>;
  onSaved: (v: Vendor) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<Partial<Vendor>>({
    wholesale: false,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name?.trim() || '',
      website_url: form.website_url || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      wholesale: !!form.wholesale,
      notes: form.notes || null,
    };
    try {
      let result;
      if (form.id) {
        result = await supabase.from('vendors').update(payload).eq('id', form.id).select().single();
      } else {
        result = await supabase.from('vendors').insert(payload).select().single();
      }
      if (result.error) throw result.error;
      onSaved(result.data as Vendor);
    } catch (err) {
      alert(`Vendor save failed: ${String((err as any).message || err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Name" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="Website" placeholder="https://" value={form.website_url || ''} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
      <Input label="Contact Name" value={form.contact_name || ''} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
      <Input label="Contact Email" type="email" value={form.contact_email || ''} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
      <Input label="Contact Phone" value={form.contact_phone || ''} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.wholesale} onChange={(e) => setForm({ ...form, wholesale: e.target.checked })} />
        Wholesale
      </label>

      <Textarea label="Notes" className="md:col-span-2" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <div className="md:col-span-2 flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>{form.id ? 'Update Vendor' : 'Create Vendor'}</Button>
      </div>
    </form>
  );
}

function VendorsPanel() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('vendors').select('*').order('name');
    if (error) alert('Load vendors failed: ' + error.message);
    setVendors((data || []) as Vendor[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: UUID) {
    if (!confirm('Delete this vendor? This cannot be undone.')) return;
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) return alert('Delete failed: ' + error.message);
    setVendors((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <SectionCard title="Vendors" subtitle="Brands, boutiques, suppliers">
      <Toolbar>
        <Button onClick={() => { setAdding(true); setEditing(null); }}>+ New Vendor</Button>
        <Button variant="ghost" onClick={load}>Refresh</Button>
      </Toolbar>

      {adding && (
        <div className="mb-6 border rounded-xl p-4 bg-emerald-50 border-emerald-200">
          <VendorForm
            onSaved={(v) => { setAdding(false); setVendors((prev) => [v, ...prev]); }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {editing && (
        <div className="mb-6 border rounded-xl p-4 bg-amber-50 border-amber-200">
          <VendorForm
            initial={editing}
            onSaved={(v) => {
              setEditing(null);
              setVendors((prev) => prev.map((x) => (x.id === v.id ? v : x)));
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {loading ? (
        <Empty message="Loading vendors…" />
      ) : vendors.length === 0 ? (
        <Empty message="No vendors yet. Add your first brand above." />
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Website</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Wholesale</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="py-2 pr-4 font-medium text-slate-800">{v.name}</td>
                  <td className="py-2 pr-4 text-emerald-700">
                    {v.website_url ? (
                      <a href={v.website_url} target="_blank" rel="noreferrer" className="hover:underline">
                        {v.website_url}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="text-slate-700">{v.contact_name || <span className="text-slate-400">—</span>}</div>
                    <div className="text-slate-500">{v.contact_email || ''}</div>
                  </td>
                  <td className="py-2 pr-4">{v.wholesale ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-4 text-right">
                    <Button variant="ghost" onClick={() => setEditing(v)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(v.id)}>Delete</Button>
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

// ---------- Products CRUD ----------
const TARGET_GENDERS = ['womens', 'mens', 'unisex', 'kids', 'unknown'] as const;

function ProductForm({ initial, onSaved, onCancel }: { initial?: Partial<Product>; onSaved: (p: Product) => void; onCancel?: () => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState<Partial<Product>>({ target_gender: 'unknown', search_tags: [], ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('vendors').select('*').order('name');
      if (error) alert('Load vendors failed: ' + error.message);
      setVendors((data || []) as Vendor[]);
    })();
  }, []);

  function setTagString(v: string) {
    const arr = v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((old) => ({ ...old, search_tags: arr }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendor_id) return alert('Please select a vendor');
    if (!form.name?.trim()) return alert('Product name is required');
    setSaving(true);
    const payload = {
      vendor_id: form.vendor_id,
      name: form.name?.trim() || '',
      description: form.description || null,
      category: form.category || null,
      subcategory: form.subcategory || null,
      target_gender: (form.target_gender || 'unknown') as Product['target_gender'],
      material: form.material || null,
      care: form.care || null,
      base_color: form.base_color || null,
      msrp: form.msrp ?? null,
      currency: form.currency || 'USD',
      external_handle: form.external_handle || null,
      search_tags: form.search_tags || [],
    };
    try {
      let result;
      if (form.id) {
        result = await supabase.from('products').update(payload).eq('id', form.id).select('*, vendor:vendors(*)').single();
      } else {
        result = await supabase.from('products').insert(payload).select('*, vendor:vendors(*)').single();
      }
      if (result.error) throw result.error;
      onSaved(result.data as Product);
    } catch (err) {
      alert('Product save failed: ' + String((err as any).message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select label="Vendor" value={form.vendor_id || ''} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} required>
        <option value="" disabled>
          Select vendor…
        </option>
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </Select>

      <Input label="Product Name" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
      <Input label="Subcategory" value={form.subcategory || ''} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />

      <Select label="Target Gender" value={form.target_gender || 'unknown'} onChange={(e) => setForm({ ...form, target_gender: e.target.value as Product['target_gender'] })}>
        {TARGET_GENDERS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </Select>

      <Input label="Base Color" value={form.base_color || ''} onChange={(e) => setForm({ ...form, base_color: e.target.value })} />
      <Input label="Material" value={form.material || ''} onChange={(e) => setForm({ ...form, material: e.target.value })} />
      <Input label="Care" value={form.care || ''} onChange={(e) => setForm({ ...form, care: e.target.value })} />

      <Input label="MSRP" type="number" step="0.01" value={form.msrp ?? ''} onChange={(e) => setForm({ ...form, msrp: e.target.value ? Number(e.target.value) : null })} />
      <Input label="Currency" value={form.currency || 'USD'} onChange={(e) => setForm({ ...form, currency: e.target.value })} />

      <Input label="External Handle" value={form.external_handle || ''} onChange={(e) => setForm({ ...form, external_handle: e.target.value })} />
      <Input
        label="Search Tags (comma separated)"
        value={(form.search_tags || []).join(', ')}
        onChange={(e) => setTagString(e.target.value)}
        className="md:col-span-2"
      />

      <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />

      <div className="md:col-span-2 flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>{form.id ? 'Update Product' : 'Create Product'}</Button>
      </div>
    </form>
  );
}

function ProductsPanel() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, vendor:vendors(*)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) alert('Load products failed: ' + error.message);
    setRows((data || []) as Product[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return rows;
    return rows.filter((p) =>
      [p.name, p.category, p.subcategory, p.base_color, ...(p.search_tags || []), p.vendor?.name]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q))
    );
  }, [rows, query]);

  async function handleDelete(id: UUID) {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return alert('Delete failed: ' + error.message);
    setRows((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <SectionCard title="Products" subtitle="Create and update product styles (variants managed elsewhere)">
      <Toolbar>
        <Button onClick={() => { setAdding(true); setEditing(null); }}>+ New Product</Button>
        <Input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button variant="ghost" onClick={load}>Refresh</Button>
      </Toolbar>

      {adding && (
        <div className="mb-6 border rounded-xl p-4 bg-emerald-50 border-emerald-200">
          <ProductForm
            onSaved={(p) => {
              setAdding(false);
              setRows((prev) => [p, ...prev]);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {editing && (
        <div className="mb-6 border rounded-xl p-4 bg-amber-50 border-amber-200">
          <ProductForm
            initial={editing}
            onSaved={(p) => {
              setEditing(null);
              setRows((prev) => prev.map((x) => (x.id === p.id ? p : x)));
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {loading ? (
        <Empty message="Loading products…" />
      ) : filtered.length === 0 ? (
        <Empty message={query ? 'No results for your search.' : 'No products yet.'} />
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Vendor</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Gender</th>
                <th className="py-2 pr-4">Color</th>
                <th className="py-2 pr-4">MSRP</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2 pr-4 font-medium text-slate-800">{p.name}</td>
                  <td className="py-2 pr-4">{p.vendor?.name || '—'}</td>
                  <td className="py-2 pr-4">{p.category || '—'}</td>
                  <td className="py-2 pr-4">{p.target_gender}</td>
                  <td className="py-2 pr-4">{p.base_color || '—'}</td>
                  <td className="py-2 pr-4">{p.msrp ? `$${p.msrp.toFixed(2)}` : '—'}</td>
                  <td className="py-2 pr-4 text-right">
                    <Button variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(p.id)}>Delete</Button>
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

// ---------- Outfits CRUD ----------
function OutfitForm({ initial, onSaved, onCancel }: { initial?: Partial<Outfit>; onSaved: (o: Outfit) => void; onCancel?: () => void }) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [form, setForm] = useState<Partial<Outfit>>({ ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('personas').select('id, display_name').order('display_name');
      if (error) alert('Load personas failed: ' + error.message);
      setPersonas((data || []) as Persona[]);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.persona_id) return alert('Select a persona');
    if (!form.title?.trim()) return alert('Title is required');
    setSaving(true);
    const payload = {
      persona_id: form.persona_id,
      title: form.title?.trim() || '',
      notes: form.notes || null,
    };
    try {
      let result;
      if (form.id) {
        result = await supabase.from('outfits').update(payload).eq('id', form.id).select('*, persona:personas(id, display_name)').single();
      } else {
        result = await supabase.from('outfits').insert(payload).select('*, persona:personas(id, display_name)').single();
      }
      if (result.error) throw result.error;
      onSaved(result.data as Outfit);
    } catch (err) {
      alert('Outfit save failed: ' + String((err as any).message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select label="Persona" value={form.persona_id || ''} onChange={(e) => setForm({ ...form, persona_id: e.target.value })} required>
        <option value="" disabled>
          Select persona…
        </option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.display_name}
          </option>
        ))}
      </Select>

      <Input label="Title" required value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Textarea label="Notes" className="md:col-span-2" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <div className="md:col-span-2 flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>{form.id ? 'Update Outfit' : 'Create Outfit'}</Button>
      </div>
    </form>
  );
}

function OutfitsPanel() {
  const [rows, setRows] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Outfit | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('outfits')
      .select('*, persona:personas(id, display_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) alert('Load outfits failed: ' + error.message);
    setRows((data || []) as Outfit[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: UUID) {
    if (!confirm('Delete this outfit?')) return;
    const { error } = await supabase.from('outfits').delete().eq('id', id);
    if (error) return alert('Delete failed: ' + error.message);
    setRows((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <SectionCard title="Outfits" subtitle="Compose looks for a persona (add items later from Wardrobe)">
      <Toolbar>
        <Button onClick={() => { setAdding(true); setEditing(null); }}>+ New Outfit</Button>
        <Button variant="ghost" onClick={load}>Refresh</Button>
      </Toolbar>

      {adding && (
        <div className="mb-6 border rounded-xl p-4 bg-emerald-50 border-emerald-200">
          <OutfitForm
            onSaved={(o) => {
              setAdding(false);
              setRows((prev) => [o, ...prev]);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {editing && (
        <div className="mb-6 border rounded-xl p-4 bg-amber-50 border-amber-200">
          <OutfitForm
            initial={editing}
            onSaved={(o) => {
              setEditing(null);
              setRows((prev) => prev.map((x) => (x.id === o.id ? o : x)));
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {loading ? (
        <Empty message="Loading outfits…" />
      ) : rows.length === 0 ? (
        <Empty message="No outfits yet." />
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Persona</th>
                <th className="py-2 pr-4">Notes</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="py-2 pr-4 font-medium text-slate-800">{o.title}</td>
                  <td className="py-2 pr-4">{o.persona?.display_name || '—'}</td>
                  <td className="py-2 pr-4 max-w-xl truncate" title={o.notes || ''}>
                    {o.notes || '—'}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <Button variant="ghost" onClick={() => setEditing(o)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(o.id)}>Delete</Button>
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

// ---------- Main Page ----------
export default function AdminPage() {
  const [active, setActive] = useState<'vendors' | 'products' | 'outfits'>('vendors');

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthGate>
      <main className="min-h-dvh bg-[#f0faf7]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <header className="glass rounded-2xl border border-emerald-200 shadow-sm bg-white/70 backdrop-blur-sm p-4 sm:p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/wendy_logo.png" alt="Wendy Davis Logo" width={40} height={40} className="h-9 w-auto" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800">SmartStyle Admin</h1>
                <p className="text-slate-500 text-sm">Internal console — employees only</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <nav className="hidden sm:flex items-center gap-2">
                {(['vendors', 'products', 'outfits'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActive(key)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition border ${
                      active === key
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {key[0].toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </nav>
              <Button variant="ghost" onClick={signOut}>Sign out</Button>
            </div>
          </header>

          {/* mobile nav */}
          <nav className="sm:hidden flex items-center gap-2 mb-4">
            {(['vendors', 'products', 'outfits'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition border ${
                  active === key
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {key[0].toUpperCase() + key.slice(1)}
              </button>
            ))}
          </nav>

          <div className="space-y-6">
            {active === 'vendors' && <VendorsPanel />}
            {active === 'products' && <ProductsPanel />}
            {active === 'outfits' && <OutfitsPanel />}
          </div>

          <footer className="mt-10 text-center text-xs text-slate-500">© {new Date().getFullYear()} SmartStyle — Admin</footer>
        </div>
      </main>
    </AuthGate>
  );
}
