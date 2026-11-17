import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore, setState, log, type Sample } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/samples")({
  head: () => ({ meta: [{ title: "Sample pipeline · Walnut Export Hub" }, { name: "description", content: "Track walnut samples: request, shipment, tracking and tasting feedback." }, { property: "og:title", content: "Sample pipeline · Walnut Export Hub" }, { property: "og:description", content: "Track walnut samples from request to feedback." }] }),
  component: Samples,
});
const STEPS: Sample["status"][] = ["requested", "shipped", "delivered", "feedback"];

function Samples() {
  const { t, tx } = useT();
  const role = useStore((s) => s.role);
  const all = useStore((s) => s.samples);
  const buyers = useStore((s) => s.buyers);
  const samples = role === "buyer" ? all.filter((x) => x.buyerId === "BUY-01") : all;
  const [ship, setShip] = useState<Sample | null>(null);
  const [fb, setFb] = useState<Sample | null>(null);
  const [form, setForm] = useState({ carrier: "DHL Express", tracking: "", feedback: "", score: "8" });
  const upd = (id: string, p: Partial<Sample>) => setState((s) => ({ samples: s.samples.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  return (
    <div>
      <PageHeader title={t("nav.samples")} sub={tx("Заявка → отправка → доставка → дегустационный отзыв", "Request → shipped → delivered → tasting feedback")} />
      <div className="space-y-3">
        {samples.map((s) => { const idx = STEPS.indexOf(s.status); return (
          <div key={s.id} className="grid items-center gap-4 rounded-lg border bg-card p-4 md:grid-cols-[200px_1fr_auto]">
            <div><div className="font-mono font-semibold">{s.id}</div><div className="text-xs text-muted-foreground">Lot {s.lotId}{role !== "buyer" && ` · ${buyers.find((b) => b.id === s.buyerId)?.company}`}</div><div className="text-xs text-muted-foreground">{s.requestedAt}</div></div>
            <div>
              <div className="flex items-center gap-1">{STEPS.map((st, i) => <div key={st} className="flex flex-1 items-center gap-1"><div className={cn("h-2 flex-1 rounded-full", i <= idx ? "bg-primary" : "bg-muted")} /></div>)}</div>
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">{STEPS.map((st) => <span key={st}>{st}</span>)}</div>
              {s.tracking && <div className="mt-2 flex items-center gap-2 text-xs"><Truck className="h-3.5 w-3.5" />{s.carrier} · <span className="font-mono">{s.tracking}</span></div>}
              {s.feedback && <div className="mt-1 text-sm">“{s.feedback}” · <b>{s.score}/10</b> · <StatusBadge s={s.result === "accepted" ? "approved" : "rejected"} /></div>}
            </div>
            <div className="flex gap-2">
              {s.status === "requested" && role === "operator" || s.status === "requested" && role === "owner" ? <Button size="sm" onClick={() => setShip(s)}>{tx("Отправить", "Ship")}</Button> : null}
              {s.status === "shipped" && role !== "qc" && <Button size="sm" variant="secondary" onClick={() => { upd(s.id, { status: "delivered" }); log(s.id, "status", "delivered"); }}>{tx("Доставлен", "Delivered")}</Button>}
              {s.status === "delivered" && (role === "buyer" || role === "owner") && <Button size="sm" onClick={() => setFb(s)}>{tx("Отзыв", "Feedback")}</Button>}
              <StatusBadge s={s.status} />
            </div>
          </div>); })}
      </div>
      {ship && <Dialog open onOpenChange={(o) => !o && setShip(null)}><DialogContent><DialogHeader><DialogTitle>{tx("Отправка образца", "Ship sample")} {ship.id}</DialogTitle></DialogHeader>
        <Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} /><Input placeholder="Tracking #" value={form.tracking} onChange={(e) => setForm({ ...form, tracking: e.target.value })} />
        <Button onClick={() => { if (!form.tracking) { toast.error("Tracking?"); return; } upd(ship.id, { status: "shipped", carrier: form.carrier, tracking: form.tracking }); log(ship.id, "status", `shipped ${form.tracking}`); setShip(null); }}>{t("save")}</Button></DialogContent></Dialog>}
      {fb && <Dialog open onOpenChange={(o) => !o && setFb(null)}><DialogContent><DialogHeader><DialogTitle>{tx("Дегустационный отзыв", "Tasting feedback")}</DialogTitle></DialogHeader>
        <Textarea placeholder={tx("Цвет, вкус, горечь, влажность…", "Colour, taste, bitterness, moisture…")} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
        <Input type="number" min={1} max={10} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
        <div className="flex gap-2">{(["accepted", "rejected"] as const).map((res) => <Button key={res} variant={res === "accepted" ? "default" : "destructive"} onClick={() => { upd(fb.id, { status: "feedback", feedback: form.feedback, score: +form.score, result: res }); log(fb.id, "feedback", `${form.score}/10 ${res}`); setFb(null); }}>{res}</Button>)}</div>
      </DialogContent></Dialog>}
    </div>
  );
}
