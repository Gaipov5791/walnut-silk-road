import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { EyeOff, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, setState, log } from "@/lib/store";
import { useMoney, useT } from "@/lib/i18n";
import { canSeeMargin, FX, landedCost, MFN_DUTY_PCT, type CostInput } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calculator")({
  head: () => ({ meta: [{ title: "Landed cost calculator · Walnut Export Hub" }, { name: "description", content: "FCA Bishkek / DAP Warsaw landed cost and margin for walnut kernels." }, { property: "og:title", content: "Landed cost calculator · Walnut Export Hub" }, { property: "og:description", content: "FCA Bishkek / DAP Warsaw landed cost and margin." }] }),
  component: Calc,
});

function Calc() {
  const { t, tx } = useT();
  const { fmt, fxNote, cur } = useMoney();
  const role = useStore((s) => s.role);
  const lots = useStore((s) => s.lots);
  const rfqs = useStore((s) => s.rfqs);
  const showMargin = canSeeMargin(role);
  const [lotId, setLotId] = useState("KG-2026-006");
  const [i, setI] = useState<CostInput>({ kg: 4000, purchaseKgsPerKg: 640, sortingKgs: 18, packagingKgs: 22, labUsd: 450, localTransportKgs: 25000, exportDocsUsd: 300, tirFreightEur: 4200, insurancePct: 0.35, brokerEur: 350, gsp: true, vatPct: 5, riskPct: 3, salePriceEurPerKg: 9.4, incoterm: "DAP" });
  const r = landedCost(i);
  const num = (k: keyof CostInput, label: string, unit: string, hide = false) => hide ? null : (
    <div><Label className="text-xs">{label} <span className="text-muted-foreground">({unit})</span></Label><Input type="number" step="any" value={i[k] as number} onChange={(e) => setI({ ...i, [k]: parseFloat(e.target.value) || 0 })} /></div>);
  const pickLot = (id: string) => { setLotId(id); const l = lots.find((x) => x.id === id); if (l) setI({ ...i, kg: l.weightKg, purchaseKgsPerKg: l.purchaseKgsPerKg }); };
  const lines: [string, number, boolean?][] = [
    [tx("Товар (закупка КР)", "Goods (KG purchase)"), r.goods], [tx("Сортировка, упаковка, анализы, документы", "Sorting, packing, lab, docs"), r.prep],
    ["= FCA Bishkek", r.fca, true],
    ...(i.incoterm === "DAP" ? ([[tx("Автоперевозка TIR", "TIR road freight"), r.freight], [tx("Страховка", "Insurance"), r.insurance], [tx("Таможенный брокер", "Customs broker"), r.broker], [`${tx("Пошлина", "Duty")} ${r.dutyPct}%${i.gsp ? " (GSP+)" : " (MFN)"}`, r.duty]] as [string, number][]) : []),
    [`${tx("Резерв риска", "Risk reserve")} ${i.riskPct}%`, r.risk], [`= ${i.incoterm === "DAP" ? "DAP Warsaw" : "FCA Bishkek"} ${tx("себестоимость", "landed cost")}`, r.total, true],
  ];
  const saveQuote = () => {
    const rfq = rfqs.find((x) => x.lotId === lotId) ?? rfqs[0];
    setState((s) => ({ rfqs: s.rfqs.map((x) => x.id === rfq.id ? { ...x, lotId, status: "quoted", quotes: [...x.quotes, { version: x.quotes.length + 1, priceEurKg: i.salePriceEurPerKg, date: new Date().toISOString().slice(0, 10), approved: false }] } : x) }));
    log(rfq.id, "quote", `v${rfq.quotes.length + 1} ${i.salePriceEurPerKg} EUR/kg · cost ${r.perKg.toFixed(2)} EUR/kg`); toast.success(`${rfq.id}: v${rfq.quotes.length + 1}`);
  };
  return (
    <div>
      <PageHeader title={t("nav.calc")} sub={`${fxNote} · 1 EUR = ${FX.rates.USD} USD = ${FX.rates.PLN} PLN = ${FX.rates.KGS} KGS`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5 rounded-lg border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label className="text-xs">Lot</Label><Select value={lotId} onValueChange={pickLot}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{lots.map((l) => <SelectItem key={l.id} value={l.id}>{l.id} · {l.grade}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Incoterms® 2020</Label><Select value={i.incoterm} onValueChange={(v) => setI({ ...i, incoterm: v as "FCA" | "DAP" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FCA">FCA Bishkek</SelectItem><SelectItem value="DAP">DAP Warsaw</SelectItem></SelectContent></Select></div>
            {num("kg", tx("Объём", "Volume"), "kg")}
          </div>
          <Section title={tx("Кыргызстан (KGS / USD)", "Kyrgyzstan (KGS / USD)")}>
            {num("purchaseKgsPerKg", tx("Закупка", "Purchase"), "KGS/kg")}{num("sortingKgs", tx("Сортировка", "Sorting"), "KGS/kg")}{num("packagingKgs", tx("Упаковка", "Packaging"), "KGS/kg")}
            {num("localTransportKgs", tx("Доставка до Бишкека", "Haul to Bishkek"), "KGS")}{num("labUsd", tx("Анализы", "Lab tests"), "USD")}{num("exportDocsUsd", tx("Экспортные документы", "Export docs"), "USD")}
          </Section>
          {i.incoterm === "DAP" && <Section title={tx("Логистика и ЕС (EUR)", "Logistics & EU (EUR)")}>
            {num("tirFreightEur", "TIR Bishkek→Warsaw", "EUR")}{num("insurancePct", tx("Страховка", "Insurance"), "%")}{num("brokerEur", tx("Брокер", "Broker"), "EUR")}
            {num("vatPct", tx("НДС PL", "VAT PL"), "%")}
            <div className="flex items-center gap-2 pt-5"><Switch checked={i.gsp} onCheckedChange={(v) => setI({ ...i, gsp: v })} /><Label className="text-xs">GSP+ 0% {tx("вместо", "instead of")} MFN {MFN_DUTY_PCT}%</Label></div>
          </Section>}
          <Section title={tx("Цена и риск", "Price & risk")}>{num("riskPct", tx("Резерв риска", "Risk reserve"), "%")}{num("salePriceEurPerKg", tx("Цена продажи", "Sale price"), "EUR/kg", !showMargin)}</Section>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 font-display text-lg font-bold">{tx("Расчёт", "Breakdown")} · {cur}</h3>
            <table className="w-full text-sm"><tbody>{lines.map(([k, v, b]) => <tr key={k} className={cn("border-b", b && "font-semibold")}><td className="py-1.5">{k}</td><td className="text-right tabular-nums">{fmt(v)}</td></tr>)}</tbody></table>
            <div className="mt-3 flex justify-between text-sm"><span className="text-muted-foreground">{tx("Себестоимость / кг", "Cost / kg")}</span><b>{fmt(r.perKg)}</b></div>
            {i.incoterm === "DAP" && <div className="flex justify-between text-xs text-muted-foreground"><span>{tx("Импортный НДС (возмещаемый, отдельно)", "Import VAT (recoverable, separate)")}</span><span>{fmt(r.vat)}</span></div>}
          </div>
          {showMargin ? (
            <div className={cn("rounded-lg border-2 p-5", r.margin >= 0 ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5")}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">{r.margin >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}{tx("Маржа ЕС", "EU margin")}</div>
              <div className={cn("font-display text-3xl font-bold", r.margin >= 0 ? "text-success" : "text-destructive")}>{fmt(r.margin)} <span className="text-base">({r.marginPct.toFixed(1)}%)</span></div>
              <div className="text-xs text-muted-foreground">{tx("Выручка", "Revenue")} {fmt(r.revenue)} · {fxNote}</div>
              <Button className="mt-4 w-full" onClick={saveQuote}>{tx("Сохранить как версию оферты", "Save as quote version")}</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-5 text-sm text-muted-foreground"><EyeOff className="h-5 w-5" />{t("hidden.margin")} (AT-01)</div>
          )}
        </div>
      </div>
    </div>
  );
}
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <div><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{title}</div><div className="grid gap-3 sm:grid-cols-3">{children}</div></div>;
