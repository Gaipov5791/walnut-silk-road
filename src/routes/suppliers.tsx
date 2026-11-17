import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, MapPin, Phone } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore, setState, log } from "@/lib/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers KG · Walnut Export Hub" }, { name: "description", content: "Verified Kyrgyz walnut kernel suppliers." }, { property: "og:title", content: "Suppliers KG · Walnut Export Hub" }, { property: "og:description", content: "Verified Kyrgyz walnut kernel suppliers." }] }),
  component: Suppliers,
});

function Suppliers() {
  const { t, tx } = useT();
  const suppliers = useStore((s) => s.suppliers);
  const lots = useStore((s) => s.lots);
  const role = useStore((s) => s.role);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", region: "", contact: "", phone: "" });
  const toggle = (id: string, v: boolean) => { setState((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, verified: v } : x)) })); log(id, "verification", v ? "verified" : "unverified"); };
  const add = () => { if (!f.name) return; setState((s) => ({ suppliers: [...s.suppliers, { id: `SUP-${String(s.suppliers.length + 1).padStart(3, "0")}`, ...f, verified: false, inn: "—", notes: "" }] })); log(f.name, "create", "supplier"); setOpen(false); toast.success("OK"); };
  return (
    <div>
      <PageHeader title={t("nav.suppliers")} sub={tx("Закрытая база поставщиков Кыргызстана", "Private Kyrgyz supplier base")}>
        {role === "operator" || role === "owner" ? <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />{t("add")}</Button> : null}
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {suppliers.map((s) => (
          <div key={s.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between"><div><div className="text-xs font-mono text-muted-foreground">{s.id}</div><h3 className="font-display text-lg font-bold">{s.name}</h3></div><StatusBadge s={s.verified ? "verified" : "unverified"} /></div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground"><div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{s.region}</div><div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{s.contact} · {s.phone}</div><div>INN: {s.inn}</div>{s.notes && <div className="italic">{s.notes}</div>}</div>
            <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm"><span>{tx("Партий", "Lots")}: <b>{lots.filter((l) => l.supplierId === s.id).length}</b></span>
              {(role === "qc" || role === "owner") && <Button size="sm" variant="outline" onClick={() => toggle(s.id, !s.verified)}>{s.verified ? tx("Снять проверку", "Unverify") : tx("Подтвердить", "Verify")}</Button>}</div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{tx("Новый поставщик", "New supplier")}</DialogTitle></DialogHeader>
        <div className="grid gap-3">{(["name", "region", "contact", "phone"] as const).map((k) => <div key={k}><Label className="capitalize">{k}</Label><Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>)}<Button onClick={add}>{t("save")}</Button></div>
      </DialogContent></Dialog>
    </div>
  );
}
