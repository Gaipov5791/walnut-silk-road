import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Boxes, CheckCircle2, FileText, Package, Users } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { useMoney, useT, type TKey } from "@/lib/i18n";
import { canApprove, canSeeMargin, landedCost, toEur } from "@/lib/domain";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Walnut Export Hub — KG → EU B2B workspace" }, { name: "description", content: "Demo B2B workspace for Kyrgyz walnut kernel exports to Poland and the EU." }, { property: "og:title", content: "Walnut Export Hub — KG → EU B2B workspace" }, { property: "og:description", content: "Demo B2B workspace for Kyrgyz walnut kernel exports to Poland and the EU." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t, tx } = useT();
  const { fmt } = useMoney();
  const s = useStore((x) => x);
  const role = s.role;
  const approved = s.lots.filter((l) => canApprove(l));
  const approvedKg = approved.reduce((a, l) => a + l.weightKg, 0);
  const pipeline = s.rfqs.reduce((a, r) => a + (r.quotes.at(-1)?.priceEurKg ?? 0) * r.volumeKg, 0);
  const margin = s.rfqs.reduce((a, r) => { const l = s.lots.find((x) => x.id === r.lotId); const q = r.quotes.at(-1); if (!l || !q) return a;
    return a + landedCost({ kg: r.volumeKg, purchaseKgsPerKg: l.purchaseKgsPerKg, sortingKgs: 18, packagingKgs: 22, labUsd: 450, localTransportKgs: 25000, exportDocsUsd: 300, tirFreightEur: 4200, insurancePct: 0.35, brokerEur: 350, gsp: true, vatPct: 5, riskPct: 3, salePriceEurPerKg: q.priceEurKg, incoterm: r.incoterm }).margin; }, 0);
  const alerts = [
    ...s.lots.filter((l) => l.lab && (l.lab.b1 > 2 || l.lab.total > 4)).map((l) => tx(`${l.id}: афлатоксины выше лимита ЕС`, `${l.id}: aflatoxins above EU limit`)),
    ...s.lots.filter((l) => (l.status === "sampled" || l.status === "draft") && !l.lab).map((l) => tx(`${l.id}: ожидает лабораторный анализ`, `${l.id}: lab test pending`)),
    ...s.rfqs.filter((r) => r.quotes.length === 0 || !r.quotes.at(-1)!.approved).map((r) => tx(`${r.id}: оферта не согласована (срок ${r.deadline})`, `${r.id}: quote not approved (deadline ${r.deadline})`)),
  ];
  const kpis = [
    { icon: Boxes, label: tx("Партий в реестре", "Lots in registry"), v: String(s.lots.length), show: role !== "buyer" },
    { icon: CheckCircle2, label: tx("Одобрено (Quality Gate)", "Approved (Quality Gate)"), v: `${approvedKg.toLocaleString()} kg`, show: true },
    { icon: Users, label: tx("Покупатели ЕС", "EU buyers"), v: String(s.buyers.length), show: role === "owner" },
    { icon: Package, label: tx("Образцы в пути", "Samples in transit"), v: String(s.samples.filter((x) => x.status === "shipped").length), show: true },
    { icon: FileText, label: tx("Пайплайн оферт", "Quote pipeline"), v: fmt(pipeline), show: role === "owner" },
    { icon: FileText, label: tx("Ожидаемая маржа ЕС", "Expected EU margin"), v: fmt(margin), show: canSeeMargin(role) },
    { icon: Boxes, label: tx("Закупочная стоимость партий", "Purchase value of lots"), v: fmt(s.lots.reduce((a, l) => a + toEur(l.purchaseKgsPerKg * l.weightKg, "KGS"), 0)), show: role === "operator" },
  ].filter((k) => k.show);
  const scenario = [
    tx("Operator KG: создайте партию и приложите происхождение", "Operator KG: create a lot and attach origin evidence"),
    tx("QC: внесите B1/сумму, приложите COA; подпись — другой ролью", "QC: enter B1/total, attach COA; sign-off by another role"),
    tx("Owner EU: оформите RFQ в CRM и посчитайте landed cost", "Owner EU: create an RFQ in CRM and run landed cost"),
    tx("Owner EU: утвердите оферту и откройте Proforma", "Owner EU: approve the quote and open the Proforma"),
    tx("Buyer: запросите образец и оставьте отзыв", "Buyer: request a sample and leave feedback"),
  ];
  return (
    <div>
      <PageHeader title={t("nav.dashboard")} sub={`${t(`role.${role}` as TKey)} · ${tx("ядро грецкого ореха, Кыргызстан → Польша / ЕС", "walnut kernels, Kyrgyzstan → Poland / EU")}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{kpis.map((k) => <div key={k.label} className="rounded-lg border bg-card p-5"><k.icon className="h-5 w-5 text-primary" /><div className="mt-3 font-display text-2xl font-bold">{k.v}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {role !== "buyer" && <div className="rounded-lg border bg-card p-5"><h3 className="flex items-center gap-2 font-display text-lg font-bold"><Bell className="h-4 w-4" />{tx("Оповещения", "Alerts")}</h3>
          <ul className="mt-3 space-y-2 text-sm">{alerts.map((a) => <li key={a} className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0 text-warning" />{a}</li>)}</ul>
          <p className="mt-3 text-xs text-muted-foreground">{tx("Система не отправляет оферты автоматически.", "The system never sends offers automatically.")}</p></div>}
        <div className="rounded-lg border bg-primary p-5 text-primary-foreground"><h3 className="font-display text-lg font-bold">{tx("Демо-сценарий для партнёров", "Partner demo scenario")}</h3>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm opacity-90">{scenario.map((x) => <li key={x}>{x}</li>)}</ol>
          <div className="mt-4 flex gap-3 text-sm underline">{role === "buyer" ? <Link to="/catalog">{t("nav.catalog")} →</Link> : <Link to="/lots">{t("nav.lots")} →</Link>}</div></div>
      </div>
    </div>
  );
}
