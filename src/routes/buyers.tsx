import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, Send } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, setState, log, type Buyer, type Rfq } from "@/lib/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/buyers")({
  head: () => ({ meta: [{ title: "Buyers CRM · Walnut Export Hub" }, { name: "description", content: "EU importer CRM and RFQ intake." }, { property: "og:title", content: "Buyers CRM · Walnut Export Hub" }, { property: "og:description", content: "EU importer CRM and RFQ intake." }] }),
  component: Buyers,
});
const STAGES: Buyer["stage"][] = ["lead", "qualified", "sampling", "negotiation", "loi"];
// CSV formula-injection safe
const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`;

function Buyers() {
  const { t, tx } = useT();
  const buyers = useStore((s) => s.buyers);
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [rfq, setRfq] = useState<null | { buyerId: string; volumeKg: string; grade: string; incoterm: "FCA" | "DAP"; deadline: string }>(null);
  const b = buyers.find((x) => x.id === sel);
  const exportCsv = () => {
    const rows = [["id", "company", "country", "contact", "email", "stage", "needs"], ...buyers.map((x) => [x.id, x.company, x.country, x.contact, x.email, x.stage, x.needs])];
    const blob = new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "buyers.csv"; a.click(); log("buyers", "export.csv", `${buyers.length} rows`);
  };
  const upd = (id: string, p: Partial<Buyer>) => setState((s) => ({ buyers: s.buyers.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const submitRfq = () => { if (!rfq) return; setState((s) => { const r: Rfq = { id: `RFQ-${1001 + s.rfqs.length}`, buyerId: rfq.buyerId, volumeKg: +rfq.volumeKg, grade: rfq.grade, packaging: "Vacuum 2×5 kg", incoterm: rfq.incoterm, deadline: rfq.deadline, tests: "Aflatoxin B1/total, moisture", status: "new", quotes: [] }; setTimeout(() => log(r.id, "create", `${r.volumeKg} kg ${r.grade} ${r.incoterm}`)); return { rfqs: [...s.rfqs, r] }; }); setRfq(null); toast.success("RFQ ✓"); };
  return (
    <div>
      <PageHeader title={t("nav.buyers")} sub={tx("Европейские импортёры и квалификация лидов", "EU importers and lead qualification")}>
        <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />CSV</Button>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-5">
        {STAGES.map((st) => (
          <div key={st} className="rounded-lg bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between"><StatusBadge s={st} /><span className="text-xs text-muted-foreground">{buyers.filter((x) => x.stage === st).length}</span></div>
            <div className="space-y-2">{buyers.filter((x) => x.stage === st).map((x) => (
              <button key={x.id} onClick={() => setSel(x.id)} className="w-full rounded-md border bg-card p-3 text-left text-sm shadow-sm hover:border-primary">
                <div className="font-medium">{x.company}</div><div className="text-xs text-muted-foreground">{x.country} · {x.contact}</div><div className="mt-1 line-clamp-2 text-xs">{x.needs}</div>
              </button>))}</div>
          </div>
        ))}
      </div>
      {b && (
        <Dialog open onOpenChange={(o) => !o && setSel(null)}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle className="font-display text-xl">{b.company}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="text-muted-foreground">{b.contact} · {b.email} · {b.country}</div>
            <div><Label>{tx("Стадия", "Stage")}</Label><Select value={b.stage} onValueChange={(v) => { upd(b.id, { stage: v as Buyer["stage"] }); log(b.id, "stage", v); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{tx("Потребности", "Needs")}</Label><p>{b.needs}</p></div>
            <div><Label>{tx("История контактов", "Contact history")}</Label><ul className="mt-1 space-y-1 border-l-2 pl-3">{b.history.map((h, i) => <li key={i}><span className="text-xs text-muted-foreground">{h.date}</span> — {h.text}</li>)}</ul>
              <div className="mt-2 flex gap-2"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx("Новая запись…", "New note…")} /><Button size="sm" onClick={() => { if (!note) return; upd(b.id, { history: [...b.history, { date: new Date().toISOString().slice(0, 10), text: note }] }); setNote(""); }}>{t("add")}</Button></div></div>
            <Button className="w-full" onClick={() => { setRfq({ buyerId: b.id, volumeKg: "5000", grade: "LHP Extra Light", incoterm: "DAP", deadline: "2026-12-31" }); setSel(null); }}><Plus className="mr-1 h-4 w-4" />{tx("Оформить RFQ", "Create RFQ")}</Button>
          </div></DialogContent></Dialog>
      )}
      {rfq && (
        <Dialog open onOpenChange={(o) => !o && setRfq(null)}><DialogContent><DialogHeader><DialogTitle>RFQ · {buyers.find((x) => x.id === rfq.buyerId)?.company}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{tx("Объём, кг", "Volume, kg")}</Label><Input value={rfq.volumeKg} onChange={(e) => setRfq({ ...rfq, volumeKg: e.target.value })} /></div>
            <div><Label>{tx("Фракция / цвет", "Grade / colour")}</Label><Textarea rows={2} value={rfq.grade} onChange={(e) => setRfq({ ...rfq, grade: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Incoterms</Label><Select value={rfq.incoterm} onValueChange={(v) => setRfq({ ...rfq, incoterm: v as "FCA" | "DAP" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FCA">FCA Bishkek</SelectItem><SelectItem value="DAP">DAP Warsaw</SelectItem></SelectContent></Select></div>
              <div><Label>{tx("Срок", "Deadline")}</Label><Input type="date" value={rfq.deadline} onChange={(e) => setRfq({ ...rfq, deadline: e.target.value })} /></div></div>
            <Button onClick={submitRfq}><Send className="mr-1 h-4 w-4" />{t("save")}</Button>
          </div></DialogContent></Dialog>
      )}
    </div>
  );
}
