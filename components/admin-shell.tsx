'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  PanelLeft,
  Shield,
  X,
  Users,
} from 'lucide-react';
import type { AppUserProfile } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';

type AdminShellProps = {
  children: ReactNode;
  profile: AppUserProfile;
};

const navigationItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/imoveis', label: 'Imoveis', icon: Home },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { href: '/admin/relatorios', label: 'Relatorios', icon: FileText },
];

export function AdminShell({ children, profile }: AdminShellProps) {
  const pathname = usePathname();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const sidebarClasses = useMemo(() => {
    if (isDesktopCollapsed) {
      return 'lg:grid-cols-[92px_1fr]';
    }

    return 'lg:grid-cols-[280px_1fr]';
  }, [isDesktopCollapsed]);

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900">
      <div className={`grid min-h-screen ${sidebarClasses}`}>
        {isMobileOpen ? (
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col border-r border-slate-200 bg-slate-950 px-4 py-5 text-white transition-transform duration-300 lg:static lg:w-auto lg:translate-x-0 lg:px-5 lg:py-6 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div
            className={`flex items-center ${
              isDesktopCollapsed ? 'justify-center lg:px-0' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary p-3">
                <Shield className="size-6" />
              </div>
              <div className={isDesktopCollapsed ? 'lg:hidden' : ''}>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Nexo
                </p>
                <h1 className="text-xl font-bold">Administracao</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsDesktopCollapsed((current) => !current)}
            className="mt-6 hidden items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white lg:inline-flex"
          >
            {isDesktopCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
            <span className={isDesktopCollapsed ? 'sr-only' : 'ml-2'}>
              Recolher menu
            </span>
          </button>

          <nav className="mt-8 space-y-2">
            {navigationItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === '/admin'
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  title={isDesktopCollapsed ? label : undefined}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${isDesktopCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                >
                  <Icon
                    className={`size-4 shrink-0 ${
                      isActive ? 'text-primary' : 'text-current'
                    }`}
                  />
                  <span className={isDesktopCollapsed ? 'lg:hidden' : ''}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <div
              className={`rounded-[1.75rem] border border-white/10 bg-white/5 p-4 ${
                isDesktopCollapsed ? 'lg:px-2 lg:py-3' : ''
              }`}
            >
              <div
                className={`${
                  isDesktopCollapsed ? 'lg:hidden' : ''
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Usuario logado
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-white">
                  {profile.email}
                </p>
              </div>

              <form
                action={logoutAction}
                className={`mt-4 ${isDesktopCollapsed ? 'lg:mt-0' : ''}`}
              >
                <button
                  title={isDesktopCollapsed ? 'Sair' : undefined}
                  className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 ${
                    isDesktopCollapsed ? 'w-full justify-center lg:px-0' : 'w-full justify-center'
                  }`}
                >
                  <LogOut className="size-4" />
                  <span className={isDesktopCollapsed ? 'lg:hidden' : ''}>Sair</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(true)}
                  className="inline-flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
                >
                  <Menu className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsDesktopCollapsed((current) => !current)}
                  className="hidden size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:inline-flex"
                >
                  <PanelLeft className="size-5" />
                </button>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80">
                    Painel administrativo
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Gestao da plataforma
                  </h2>
                </div>
              </div>

              <div className="hidden sm:block" />
            </div>
          </header>

          <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
