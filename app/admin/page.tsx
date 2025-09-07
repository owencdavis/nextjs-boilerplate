// app/admin/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import CrudPanel from '@/components/crud/CrudPanel';
import {
  VendorsConfig,
  ProductsConfig,
  ProductVariantsConfig,
  InventoryConfig,
  MediaAssetsConfig,
  PersonasConfig,
  PersonaMeasurementsConfig,
  PersonaPreferencesConfig,
  WardrobesConfig,
  WardrobeItemsConfig,
  OutfitsConfig,
  OutfitItemsConfig,
} from '@/components/crud/configs';
import { Button } from '@/components/ui';

// ---------- Allowlist helpers (same behavior you had) ----------
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
  if (!ALLOWLIST_EMAILS.length && !ALLOWLIST_DOMAIN) return true; // default allow if not configured
  return false;
}

// ---------- Auth Gate ----------
function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      const { data: ud } = await supabase.auth.getUser();
      setUser(ud.user ?? null);
      setChecking(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
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
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button type="submit" disabled={sending}>{sending ? 'Sending link…' : 'Send magic link'}</Button>
              </form>
              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
              {session && !allowed && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  Your account (<span className="font-medium">{user?.email}</span>) isn’t on the allowlist.
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

  return <>{children}</>;
}

export default function AdminPage() {
  const TABS = [
    { key: 'vendors', label: 'Vendors', cfg: VendorsConfig },
    { key: 'products', label: 'Products', cfg: ProductsConfig },
    { key: 'product-variants', label: 'Product Variants', cfg: ProductVariantsConfig },
    { key: 'inventory', label: 'Inventory', cfg: InventoryConfig },
    { key: 'media-assets', label: 'Media Assets', cfg: MediaAssetsConfig },
    { key: 'personas', label: 'Personas', cfg: PersonasConfig },
    { key: 'persona-measurements', label: 'Measurements', cfg: PersonaMeasurementsConfig },
    { key: 'persona-preferences', label: 'Preferences', cfg: PersonaPreferencesConfig },
    { key: 'wardrobes', label: 'Wardrobes', cfg: WardrobesConfig },
    { key: 'wardrobe-items', label: 'Wardrobe Items', cfg: WardrobeItemsConfig },
    { key: 'outfits', label: 'Outfits', cfg: OutfitsConfig },
    { key: 'outfit-items', label: 'Outfit Items', cfg: OutfitItemsConfig },
  ] as const;

  const [active, setActive] = useState<typeof TABS[number]['key']>('vendors');

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
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActive(key)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition border ${
                      active === key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <Button variant="ghost" onClick={signOut}>Sign out</Button>
            </div>
          </header>

          {/* Mobile nav */}
          <nav className="sm:hidden flex items-center gap-2 mb-4">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition border ${
                  active === key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="space-y-6">
            {TABS.map(({ key, cfg }) => active === key ? <CrudPanel key={key} {...cfg} /> : null)}
          </div>

          <footer className="mt-10 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} SmartStyle — Admin
          </footer>
        </div>
      </main>
    </AuthGate>
  );
}
