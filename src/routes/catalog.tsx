import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { DocSheet } from "@/components/app/DocSheet";
import { useStore, setState, log } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { canApprove, type Lot } from "@/lib/domain";

export const Route = createFileRoute("/catalog")({
  head: () => ({ meta: [{ title: "Buyer catalog · Walnut Export Hub" }, { name: "description", content: "Available Kyrgyz walnut kernel lots for EU buyers." }, { property: "og:title", content: "Buyer catalog · Walnut Export Hub" }, { property: "og:description", content: "Available walnut kernel lots for EU buyers." }] }),
  component: Catalog,
});
function Catalog() {
  const { t, tx } = useT();
  // Buyer sees no supplier names nor purchase prices
  const lots = useStore((s) => s.lots).filter((l) => ["tested", "approved", "offered"].includes(l.status));
  const [spec, setSpec] = useState<Lot | null>(null);
  const request = (l: Lot) => { setState((s) => ({ samples: [...s.samples, { id: `SMP-${String(s.samples.length + 1).padStart(2, "0")}`, lotId: l.id, buyerId: "BUY-01", status: "requested", requestedAt: new Date().toISOString().slice(0, 10) }] })); log(l.id, "sample.request", "BUY-01"); toast.success(tx("Образец запрошен", "Sample requested")); };
  return (
    <div>
      <PageHeader title={t("nav.catalog")} sub="Walnut kernels · Kyrgyzstan · HS 0802 32" />
      <div className="grid gap-4 md:grid-cols-3">{lots.map((l) => { const ok = canApprove(l); return (
        <div key={l.id} className="rounded-lg border bg-card p-5">
          <div className="flex justify-between"><span className="font-mono text-xs">{l.id}</span>{ok ? <StatusBadge s="approved" /> : <span className="text-xs italic text-warning-foreground">{t("subject")}</span>}</div>
          <h3 className="mt-2 font-display text-xl font-bold">{l.grade} · {l.color}</h3>
          <p className="text-sm text-muted-foreground">{l.region}, KG · {l.weightKg.toLocaleString()} kg · {l.packaging}</p>
          <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => setSpec(l)}>Spec</Button><Button size="sm" onClick={() => request(l)}>{tx("Запросить образец", "Request sample")}</Button></div>
        </div>); })}</div>
      {spec && <DocSheet open onOpenChange={(o) => !o && setSpec(null)} kind="spec" lot={spec} />}
    </div>
  );
}
