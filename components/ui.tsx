// components/ui.tsx
'use client';

import React from 'react';

export function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>;
}

export function Button({
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
  const base = 'inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm';
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

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block text-sm mb-3">
      {label && <span className="block text-slate-600 mb-1">{label}</span>}
      <input
        {...props}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${props.className || ''}`}
      />
    </label>
  );
}

export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block text-sm mb-3">
      {label && <span className="block text-slate-600 mb-1">{label}</span>}
      <textarea
        {...props}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[90px] ${props.className || ''}`}
      />
    </label>
  );
}

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block text-sm mb-3">
      {label && <span className="block text-slate-600 mb-1">{label}</span>}
      <select
        {...props}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${props.className || ''}`}
      >
        {children}
      </select>
    </label>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <div className="text-center text-slate-500 py-8">
      <p>{message}</p>
    </div>
  );
}

