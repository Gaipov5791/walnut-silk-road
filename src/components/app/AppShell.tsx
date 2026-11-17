import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
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
  const currency = useStore((s) => s.currency);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV.filter((n) => n.roles.includes(role));
  const current = NAV.find((n) => n.to === path);
  const allowed = !current || current.roles.includes(role);

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
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-card/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="font-display text-lg font-bold md:hidden">Walnut Export Hub</div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t("role.label")}</span>
            <Select value={role} onValueChange={(v) => { setState(() => ({ role: v as Role })); log("session", "role.switch", `→ ${v}`); }}>
              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{(["owner", "operator", "qc", "buyer"] as Role[]).map((r) => <SelectItem key={r} value={r}>{t(`role.${r}` as TKey)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border">
              {(["ru", "en"] as const).map((l) => (
                <button key={l} onClick={() => setState(() => ({ lang: l }))} className={cn("px-3 py-1 text-xs font-medium uppercase", lang === l ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>{l}</button>
              ))}
            </div>
            <Select value={currency} onValueChange={(v) => setState(() => ({ currency: v as Currency }))}>
              <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{(["EUR", "USD", "PLN", "KGS"] as Currency[]).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={resetDemo} title={t("reset")}><RotateCcw className="h-4 w-4" /></Button>
          </div>
          <nav className="flex w-full gap-1 overflow-x-auto md:hidden">
            {items.map((n) => <Link key={n.to} to={n.to} className={cn("whitespace-nowrap rounded px-2 py-1 text-xs", path === n.to ? "bg-primary text-primary-foreground" : "bg-muted")}>{t(n.key)}</Link>)}
          </nav>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">
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

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>{sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}</div>
      <div className="flex gap-2">{children}</div>
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
