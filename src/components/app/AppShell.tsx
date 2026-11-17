import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BarChart3, Boxes, Building2, Calculator, FileText, History, Package, ShieldCheck, Store, Users, RotateCcw } from "lucide-react";
import { hydrate, resetDemo, setState, useStore, log } from "@/lib/store";
import { useT, type TKey } from "@/lib/i18n";
import type { Currency, Role } from "@/lib/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const NAV: { to: string; key: TKey; icon: typeof Boxes; roles: Role[] }[] = [
  { to: "/", key: "nav.dashboard", icon: BarChart3, roles: ["owner", "operator", "qc", "buyer"] },
  { to: "/catalog", key: "nav.catalog", icon: Store, roles: ["buyer"] },
  { to: "/suppliers", key: "nav.suppliers", icon: Building2, roles: ["owner", "operator", "qc"] },
  { to: "/lots", key: "nav.lots", icon: Boxes, roles: ["owner", "operator", "qc"] },
  { to: "/buyers", key: "nav.buyers", icon: Users, roles: ["owner"] },
  { to: "/rfq", key: "nav.rfq", icon: FileText, roles: ["owner", "buyer"] },
  { to: "/calculator", key: "nav.calc", icon: Calculator, roles: ["owner", "operator"] },
  { to: "/samples", key: "nav.samples", icon: Package, roles: ["owner", "operator", "qc", "buyer"] },
  { to: "/audit", key: "nav.audit", icon: History, roles: ["owner", "operator", "qc"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => hydrate(), []);
  const { t, tx, lang } = useT();
  const role = useStore((s) => s.role);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV.filter((n) => n.roles.includes(role));
  const current = NAV.find((n) => n.to === path);
  const allowed = !current || current.roles.includes(role);
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 py-6">
          <div className="font-display text-xl font-bold leading-tight text-sidebar-accent-foreground">Walnut<br />Export Hub</div>
          <div className="mt-1 text-xs opacity-70">KG → PL / EU · HS 080232</div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {items.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent", path === n.to && "bg-sidebar-accent font-medium text-sidebar-primary")}>
              <n.icon className="h-4 w-4" /> {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="p-4 text-xs opacity-60">{t("demo")}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-card/90 px-3 py-2 backdrop-blur md:px-8 md:py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={() => setMenu(true)} aria-label="Menu"><Menu className="h-5 w-5" /></Button>
            <div className="min-w-0 flex-1 md:hidden">
              <div className="truncate font-display text-base font-bold leading-tight">Walnut Export Hub</div>
              <div className="truncate text-xs text-muted-foreground">{current ? t(current.key) : ""}</div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t("role.label")}</span>
              <RoleSelect className="h-8 w-44" />
            </div>
            <div className="flex shrink-0 items-center gap-1.5 md:ml-auto md:gap-2">
              <div className="flex overflow-hidden rounded-md border">
                {(["ru", "en"] as const).map((l) => (
                  <button key={l} onClick={() => setState(() => ({ lang: l }))} className={cn("px-2 py-1 text-xs font-medium uppercase md:px-3", lang === l ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>{l}</button>
                ))}
              </div>
              <div className="hidden md:block"><CurrencySelect /></div>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={resetDemo} title={t("reset")}><RotateCcw className="h-4 w-4" /></Button>
            </div>
          </div>
        </header>
        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-0 text-sidebar-foreground">
            <SheetHeader className="px-5 pb-2 pt-6 text-left">
              <SheetTitle className="font-display text-xl font-bold text-sidebar-accent-foreground">Walnut Export Hub</SheetTitle>
              <div className="text-xs opacity-70">KG → PL / EU · HS 080232</div>
            </SheetHeader>
            <div className="space-y-3 border-b border-sidebar-border px-5 pb-4">
              <div><div className="mb-1 flex items-center gap-1 text-xs opacity-70"><ShieldCheck className="h-3 w-3" />{t("role.label")}</div><RoleSelect className="h-9 w-full bg-background text-foreground" /></div>
              <div className="flex items-center gap-2"><CurrencySelect className="h-9 flex-1 bg-background text-foreground" />
                <Button variant="secondary" size="sm" className="h-9" onClick={() => { resetDemo(); setMenu(false); }}><RotateCcw className="mr-1 h-4 w-4" />{t("reset")}</Button></div>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
              {items.map((n) => (
                <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-sidebar-accent", path === n.to && "bg-sidebar-accent font-medium text-sidebar-primary")}>
                  <n.icon className="h-4 w-4" /> {t(n.key)}
                </Link>
              ))}
            </nav>
            <div className="p-4 text-xs opacity-60">{t("demo")}</div>
          </SheetContent>
        </Sheet>
        <main className="min-w-0 flex-1 px-3 py-5 md:px-8 md:py-6">
          {allowed ? children : (
            <div className="mx-auto mt-20 max-w-md rounded-lg border bg-card p-8 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="mt-3 font-display text-xl font-bold">{tx("Нет доступа", "Access denied")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tx("Роль", "Role")} «{t(`role.${role}` as TKey)}» {tx("не имеет доступа к этому разделу (RBAC).", "has no access to this section (RBAC).")}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function RoleSelect({ className }: { className?: string }) {
  const { t } = useT();
  const role = useStore((s) => s.role);
  return (
    <Select value={role} onValueChange={(v) => { setState(() => ({ role: v as Role })); log("session", "role.switch", `→ ${v}`); }}>
      <SelectTrigger className={className}><SelectValue /></SelectTrigger>
      <SelectContent>{(["owner", "operator", "qc", "buyer"] as Role[]).map((r) => <SelectItem key={r} value={r}>{t(`role.${r}` as TKey)}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function CurrencySelect({ className = "h-8 w-24" }: { className?: string }) {
  const currency = useStore((s) => s.currency);
  return (
    <Select value={currency} onValueChange={(v) => setState(() => ({ currency: v as Currency }))}>
      <SelectTrigger className={className}><SelectValue /></SelectTrigger>
      <SelectContent>{(["EUR", "USD", "PLN", "KGS"] as Currency[]).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
    </Select>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", sampled: "bg-secondary text-secondary-foreground", tested: "bg-warning/30 text-warning-foreground",
  approved: "bg-success text-success-foreground", offered: "bg-accent text-accent-foreground", reserved: "bg-primary/15 text-primary", sold: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground", requested: "bg-muted text-muted-foreground", shipped: "bg-warning/30 text-warning-foreground", delivered: "bg-accent text-accent-foreground",
  feedback: "bg-success text-success-foreground", new: "bg-warning/30 text-warning-foreground", quoted: "bg-accent text-accent-foreground", declined: "bg-destructive text-destructive-foreground",
  verified: "bg-success text-success-foreground", unverified: "bg-warning/30 text-warning-foreground",
  lead: "bg-muted text-muted-foreground", qualified: "bg-secondary text-secondary-foreground", sampling: "bg-warning/30 text-warning-foreground", negotiation: "bg-accent text-accent-foreground", loi: "bg-success text-success-foreground",
};
export function StatusBadge({ s }: { s: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", TONE[s] ?? "bg-muted")}>{s}</span>;
}
