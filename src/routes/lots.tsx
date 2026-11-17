import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Lock, Plus, XCircle, FileText } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/AppShell";
import { DocSheet } from "@/components/app/DocSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, updateLot, setLotStatus, log, setState } from "@/lib/store";
import { useMoney, useT, type TKey } from "@/lib/i18n";
import { canApprove, canQcSign, canSeePurchase, hashStr, NEXT_STATUS, qualityGate, toEur, AFLA_B1_MAX, AFLA_TOTAL_MAX, type Grade, type KernelColor, type Lot } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lots")({
  head: () => ({ meta: [{ title: "Lots registry · Walnut Export Hub" }, { name: "description", content: "Walnut kernel lots with UNECE DDP-02 grading and aflatoxin quality gate." }, { property: "og:title", content: "Lots registry · Walnut Export Hub" }, { property: "og:description", content: "Walnut kernel lots with UNECE grading and quality gate." }] }),
  component: LotsPage,
});

const GRADES: Grade[] = ["LHP", "Quarters", "Mix", "Pieces"];
const COLORS: KernelColor[] = ["Extra Light", "Light", "Light Amber", "Amber"];
const gradeLabel = (g: Grade, ru: boolean) => ({ LHP: ru ? "Половинки «бабочка»" : "Halves (butterfly)", Quarters: ru ? "Четвертинки" : "Quarters", Mix: ru ? "Микс" : "Mix", Pieces: ru ? "Кусочки" : "Pieces" })[g];

function LotsPage() {
  const { t, tx, lang } = useT();
  const { fmt } = useMoney();
  const lots = useStore((s) => s.lots);
  const suppliers = useStore((s) => s.suppliers);
  const role = useStore((s) => s.role);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const lot = lots.find((l) => l.id === openId);
  const shown = lots.filter((l) => filter === "all" || l.status === filter);
  return (
    <div>
      <PageHeader title={t("nav.lots")} sub={tx("Реестр партий · UNECE DDP-02 · Регламент ЕС 2023/915", "Lot registry · UNECE DDP-02 · Reg. (EU) 2023/915")}>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-32 sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{tx("Все", "All")}</SelectItem>{Object.keys(NEXT_STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        {role === "operator" || role === "owner" ? <Button onClick={() => setNewOpen(true)}><Plus className="mr-1 h-4 w-4" />{tx("Новая партия", "New lot")}</Button> : null}
      </PageHeader>
      <div className="space-y-2 md:hidden">
        {shown.map((l) => { const ok = canApprove(l); const bad = l.lab && (l.lab.b1 > AFLA_B1_MAX || l.lab.total > AFLA_TOTAL_MAX); return (
          <button key={l.id} onClick={() => setOpenId(l.id)} className="w-full rounded-lg border bg-card p-3 text-left text-sm active:bg-muted/40">
            <div className="flex items-center justify-between gap-2"><span className="font-mono font-medium">{l.id}</span><div className="flex shrink-0 items-center gap-2">{ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Lock className="h-4 w-4 text-muted-foreground" />}<StatusBadge s={l.status} /></div></div>
            <div className="mt-1 truncate text-muted-foreground">{suppliers.find((s) => s.id === l.supplierId)?.name}</div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span>{gradeLabel(l.grade, lang === "ru")}</span><span>{l.color}</span>
              <span>{l.weightKg.toLocaleString()} kg</span><span className={cn(bad && "font-semibold text-destructive")}>B1/Σ: {l.lab ? `${l.lab.b1} / ${l.lab.total}` : "—"}</span>
              {canSeePurchase(role) && <span className="col-span-2 text-muted-foreground">{tx("Закупка/кг", "Purchase/kg")}: {fmt(toEur(l.purchaseKgsPerKg, "KGS"))}</span>}
            </div>
          </button>); })}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr className="[&_th]:px-4 [&_th]:py-3"><th>Lot ID</th><th>{t("supplier")}</th><th>{t("grade")}</th><th>{t("color")}</th><th className="text-right">{t("weight")}</th><th>B1 / Σ</th><th>{tx("Закупка/кг", "Purchase/kg")}</th><th>Gate</th><th>{t("status")}</th></tr></thead>
          <tbody>
            {shown.map((l) => { const ok = canApprove(l); return (
              <tr key={l.id} onClick={() => setOpenId(l.id)} className="cursor-pointer border-t hover:bg-muted/40 [&_td]:px-4 [&_td]:py-3">
                <td className="font-mono font-medium">{l.id}</td>
                <td>{suppliers.find((s) => s.id === l.supplierId)?.name}</td>
                <td>{gradeLabel(l.grade, lang === "ru")}</td><td>{l.color}</td>
                <td className="text-right">{l.weightKg.toLocaleString()} kg</td>
                <td className={cn(l.lab && (l.lab.b1 > AFLA_B1_MAX || l.lab.total > AFLA_TOTAL_MAX) && "font-semibold text-destructive")}>{l.lab ? `${l.lab.b1} / ${l.lab.total}` : "—"}</td>
                <td>{canSeePurchase(role) ? fmt(toEur(l.purchaseKgsPerKg, "KGS")) : "—"}</td>
                <td>{ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Lock className="h-4 w-4 text-muted-foreground" />}</td>
                <td><StatusBadge s={l.status} /></td>
              </tr>); })}
          </tbody>
        </table>
      </div>
      {lot && <LotDialog lot={lot} onClose={() => setOpenId(null)} />}
      <NewLot open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function LotDialog({ lot, onClose }: { lot: Lot; onClose: () => void }) {
  const { t, tx, lang } = useT();
  const role = useStore((s) => s.role);
  const supplier = useStore((s) => s.suppliers.find((x) => x.id === lot.supplierId));
  const [doc, setDoc] = useState(false);
  const gate = qualityGate(lot);
  const ok = gate.every((c) => c.ok);
  const [b1, setB1] = useState(String(lot.lab?.b1 ?? ""));
  const [tot, setTot] = useState(String(lot.lab?.total ?? ""));
  const canEditLab = role === "operator" || role === "qc";

  const attach = (field: "originFile" | "gspFormA") => { const f = `${field === "originFile" ? "Origin" : "GSP_FormA"}_${lot.id}.pdf`; updateLot(lot.id, { [field]: f }); log(lot.id, "file.upload", `${f} · sha256:${hashStr(f)}`); toast.success(tx("Файл прикреплён", "File attached")); };
  const saveLab = (withCoa: boolean) => {
    const vb1 = parseFloat(b1), vt = parseFloat(tot);
    if (isNaN(vb1) || isNaN(vt)) { toast.error(tx("Введите значения", "Enter values")); return; }
    const coa = withCoa ? `COA_${lot.id}.pdf` : lot.lab?.coaFile;
    updateLot(lot.id, { qcApprovedBy: undefined, lab: { lab: "Eurofins Polska", sampledAt: "2026-11-14", validUntil: "2027-05-14", moisture: 4.1, b1: vb1, total: vt, coaFile: coa, coaHash: coa ? "sha256:" + hashStr(coa + vb1) : undefined, uploadedBy: role } });
    log(lot.id, "lab.upload", `B1 ${vb1} / total ${vt}${withCoa ? " + COA" : ""}`);
    toast.success(tx("Результаты сохранены — нужна новая подпись QC", "Results saved — new QC sign-off required"));
  };
  const sign = () => { if (!canQcSign(lot, role)) { toast.error(tx("QC не может единолично подтвердить собственные данные", "QC cannot solely confirm its own data")); return; } updateLot(lot.id, { qcApprovedBy: role }); log(lot.id, "qc.sign", `QC sign-off by ${role}`); toast.success("QC ✓"); };
  const move = (to: Lot["status"]) => {
    if (to === "approved" && !ok) { log(lot.id, "status.blocked", "approved blocked by Quality Gate"); { toast.error(t("gate.blocked")); return; } }
    if (to === "approved" && role !== "owner" && role !== "qc") { toast.error(tx("Только Owner/QC", "Owner/QC only")); return; }
    setLotStatus(lot.id, lot.status, to); toast.success(`${lot.status} → ${to}`);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle className="flex items-center gap-3 font-display text-2xl">{lot.id} <StatusBadge s={lot.status} /></DialogTitle></DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <Row k={t("supplier")} v={`${supplier?.name} ${supplier?.verified ? "✓" : "(unverified)"}`} />
            <Row k={t("region")} v={`${lot.region}, KG · ${lot.season}`} />
            <Row k={t("grade")} v={`${gradeLabel(lot.grade, lang === "ru")} (UNECE DDP-02)`} />
            <Row k={t("color")} v={lot.color} />
            <Row k={t("weight")} v={`${lot.weightKg.toLocaleString()} kg`} />
            <Row k={tx("Упаковка", "Packaging")} v={lot.packaging} />
            <Row k={tx("Фото", "Photos")} v={String(lot.photos)} />
            <div className="pt-3"><Label className="text-xs">{tx("Лабораторные показатели (мкг/кг)", "Lab results (µg/kg)")}</Label>
              <div className="mt-1 flex gap-2"><Input disabled={!canEditLab} value={b1} onChange={(e) => setB1(e.target.value)} placeholder="B1" /><Input disabled={!canEditLab} value={tot} onChange={(e) => setTot(e.target.value)} placeholder="Σ B1+B2+G1+G2" /></div>
              {canEditLab ? <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => saveLab(false)}>{t("save")}</Button><Button size="sm" variant="outline" onClick={() => saveLab(true)}><FileUp className="mr-1 h-3 w-3" />+ COA</Button></div>
                : <p className="mt-1 text-xs text-muted-foreground">{tx("Owner не может подменить лабораторный результат", "Owner cannot override lab results")}</p>}
              {lot.lab && <p className="mt-2 text-xs text-muted-foreground">{lot.lab.lab} · {tx("загрузил", "uploaded by")} {lot.lab.uploadedBy} · {lot.lab.coaHash ?? "no file"}</p>}
            </div>
          </div>
          <div className={cn("rounded-lg border-2 p-4", ok ? "border-success/50 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
            <div className="flex items-center gap-2 font-display font-bold">{ok ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Lock className="h-5 w-5 text-destructive" />}{t("gate.title")}</div>
            <p className="mb-3 text-xs text-muted-foreground">{ok ? t("gate.ok") : t("gate.blocked")}</p>
            <ul className="space-y-1.5 text-sm">{gate.map((c) => <li key={c.key} className="flex items-center gap-2">{c.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}{t(c.key as TKey)}</li>)}</ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {!lot.originFile && role !== "buyer" && <Button size="sm" variant="outline" onClick={() => attach("originFile")}><FileUp className="mr-1 h-3 w-3" />Origin</Button>}
              {!lot.gspFormA && role !== "buyer" && <Button size="sm" variant="outline" onClick={() => attach("gspFormA")}><FileUp className="mr-1 h-3 w-3" />GSP+</Button>}
              {!lot.qcApprovedBy && (role === "qc" || role === "owner") && <Button size="sm" onClick={sign}>{tx("Подписать QC", "QC sign-off")}</Button>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <span className="text-xs text-muted-foreground">{tx("Перевести в:", "Move to:")}</span>
          {NEXT_STATUS[lot.status].map((s) => <Button key={s} size="sm" variant={s === "rejected" ? "destructive" : s === "approved" ? "default" : "secondary"} onClick={() => move(s)}>{s === "approved" && !ok && <Lock className="mr-1 h-3 w-3" />}{s}</Button>)}
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setDoc(true)}><FileText className="mr-1 h-4 w-4" />Spec Sheet</Button>
        </div>
        <DocSheet open={doc} onOpenChange={setDoc} kind="spec" lot={lot} />
      </DialogContent>
    </Dialog>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between border-b border-dashed pb-1.5"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span></div>;

function NewLot({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tx, t } = useT();
  const suppliers = useStore((s) => s.suppliers);
  const [f, setF] = useState({ supplierId: "SUP-001", weightKg: "3000", grade: "LHP" as Grade, color: "Light" as KernelColor, price: "580" });
  const create = () => {
    setState((s) => { const id = `KG-2026-${String(s.lots.length + 1).padStart(3, "0")}`; const sup = s.suppliers.find((x) => x.id === f.supplierId)!;
      const lot: Lot = { id, supplierId: f.supplierId, weightKg: +f.weightKg, season: "2026", region: sup.region.split(",").at(-1)!.trim(), grade: f.grade, color: f.color, packaging: "Vacuum 2×5 kg / carton", status: "draft", purchaseKgsPerKg: +f.price, photos: 0 };
      setTimeout(() => log(id, "create", `${f.weightKg} kg ${f.grade}`)); return { lots: [...s.lots, lot] }; });
    onOpenChange(false); toast.success(tx("Партия создана", "Lot created"));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{tx("Новая партия", "New lot")}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <Label>{t("supplier")}</Label><Select value={f.supplierId} onValueChange={(v) => setF({ ...f, supplierId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("grade")}</Label><Select value={f.grade} onValueChange={(v) => setF({ ...f, grade: v as Grade })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>{t("color")}</Label><Select value={f.color} onValueChange={(v) => setF({ ...f, color: v as KernelColor })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COLORS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>{t("weight")} (kg)</Label><Input value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: e.target.value })} /></div>
          <div><Label>{tx("Закупка KGS/кг", "Purchase KGS/kg")}</Label><Input value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
        </div>
        <Button onClick={create}>{t("add")}</Button>
      </div></DialogContent></Dialog>
  );
}
