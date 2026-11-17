import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileText, Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/AppShell";
import { DocSheet } from "@/components/app/DocSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, setState, log, type Rfq } from "@/lib/store";
import { useMoney, useT } from "@/lib/i18n";
import { canApprove } from "@/lib/domain";

export const Route = createFileRoute("/rfq")({
  head: () => ({ meta: [{ title: "RFQ & quotes · Walnut Export Hub" }, { name: "description", content: "Buyer RFQs, versioned quotes and proforma drafts." }, { property: "og:title", content: "RFQ & quotes · Walnut Export Hub" }, { property: "og:description", content: "Buyer RFQs, versioned quotes and proforma drafts." }] }),
  component: RfqPage,
});
export const DEMO_BUYER = "BUY-01";

function RfqPage() {
  const { t, tx } = useT();
  const { fmt } = useMoney();
  const role = useStore((s) => s.role);
  const all = useStore((s) => s.rfqs);
  const buyers = useStore((s) => s.buyers);
  const lots = useStore((s) => s.lots);
  const rfqs = role === "buyer" ? all.filter((r) => r.buyerId === DEMO_BUYER) : all;
  const [doc, setDoc] = useState<Rfq | null>(null);
  const [price, setPrice] = useState<Record<string, string>>({});
  const upd = (id: string, fn: (r: Rfq) => Partial<Rfq>) => setState((s) => ({ rfqs: s.rfqs.map((r) => (r.id === id ? { ...r, ...fn(r) } : r)) }));
  const owner = role === "owner";
  return (
    <div>
      <PageHeader title={role === "buyer" ? tx("Мои запросы", "My requests") : t("nav.rfq")} sub={role === "buyer" ? "Bakalland Trade Sp. z o.o." : tx("Оферты утверждаются вручную владельцем", "Quotes are approved manually by owner")} />
      <div className="space-y-4">
        {rfqs.map((r) => { const lot = lots.find((l) => l.id === r.lotId); const gated = lot ? canApprove(lot) : false; const last = r.quotes.at(-1);
          const visibleQuotes = role === "buyer" ? r.quotes.filter((q) => q.approved) : r.quotes;
          return (
          <div key={r.id} className="rounded-lg border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex items-center gap-2"><span className="font-mono font-semibold">{r.id}</span><StatusBadge s={r.status} /></div>
                <div className="mt-1 text-sm text-muted-foreground">{buyers.find((b) => b.id === r.buyerId)?.company} · {r.volumeKg.toLocaleString()} kg · {r.grade} · {r.incoterm === "DAP" ? "DAP Warsaw" : "FCA Bishkek"} · {tx("до", "by")} {r.deadline}</div>
                <div className="text-xs text-muted-foreground">{tx("Тесты", "Tests")}: {r.tests}</div></div>
              {owner && <Select value={r.lotId ?? ""} onValueChange={(v) => { upd(r.id, () => ({ lotId: v })); log(r.id, "lot.link", v); }}><SelectTrigger className="w-56"><SelectValue placeholder={tx("Привязать партию", "Link lot")} /></SelectTrigger><SelectContent>{lots.filter((l) => l.status !== "rejected" && l.status !== "sold").map((l) => <SelectItem key={l.id} value={l.id}>{l.id} · {l.grade} {canApprove(l) ? "✓" : "(subject to tests)"}</SelectItem>)}</SelectContent></Select>}
            </div>
            {lot && !gated && <div className="mt-3 flex items-center gap-2 rounded bg-warning/20 px-3 py-2 text-xs"><AlertTriangle className="h-4 w-4" />{tx("Партия не прошла Quality Gate — только черновик «subject to tests», подтверждение оферты заблокировано", "Lot has not passed Quality Gate — draft 'subject to tests' only; confirmation blocked")}</div>}
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-3">
              {visibleQuotes.map((q) => <div key={q.version} className="rounded border px-3 py-1.5 text-sm"><span className="text-xs text-muted-foreground">v{q.version} · {q.date}</span><div className="font-semibold">{fmt(q.priceEurKg)}/kg {q.approved && <CheckCircle2 className="inline h-4 w-4 text-success" />}</div></div>)}
              {visibleQuotes.length === 0 && <span className="text-sm text-muted-foreground">{tx("Оферт пока нет", "No quotes yet")}</span>}
              <div className="ml-auto flex flex-wrap gap-2">
                {owner && <><Input className="w-28" placeholder="EUR/kg" value={price[r.id] ?? ""} onChange={(e) => setPrice({ ...price, [r.id]: e.target.value })} />
                  <Button size="sm" variant="secondary" onClick={() => { const p = parseFloat(price[r.id] ?? ""); if (!p) return; upd(r.id, (x) => ({ status: "quoted", quotes: [...x.quotes, { version: x.quotes.length + 1, priceEurKg: p, date: new Date().toISOString().slice(0, 10), approved: false }] })); log(r.id, "quote", `v${r.quotes.length + 1} ${p} EUR/kg`); setPrice({ ...price, [r.id]: "" }); }}><Plus className="mr-1 h-3 w-3" />{tx("Версия", "Version")}</Button>
                  {last && !last.approved && <Button size="sm" disabled={!gated} onClick={() => { upd(r.id, (x) => ({ status: "approved", quotes: x.quotes.map((q, i) => (i === x.quotes.length - 1 ? { ...q, approved: true } : q)) })); log(r.id, "quote.approve", `v${last.version} approved manually`); toast.success(tx("Оферта утверждена", "Quote approved")); }}>{tx("Утвердить", "Approve")}</Button>}</>}
                {lot && (owner || visibleQuotes.length > 0) && <Button size="sm" variant="outline" onClick={() => setDoc(r)}><FileText className="mr-1 h-4 w-4" />Proforma</Button>}
              </div>
            </div>
          </div>); })}
      </div>
      {doc && <DocSheet open onOpenChange={(o) => !o && setDoc(null)} kind="proforma" rfq={doc} lot={lots.find((l) => l.id === doc.lotId)} />}
    </div>
  );
}
