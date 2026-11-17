import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useStore, log } from "@/lib/store";
import { FX, canApprove, fromEur, type Lot } from "@/lib/domain";
import type { Rfq } from "@/lib/store";
import { useT } from "@/lib/i18n";

export type DocKind = "spec" | "proforma";
export function DocSheet({ open, onOpenChange, kind, lot, rfq }: { open: boolean; onOpenChange: (o: boolean) => void; kind: DocKind; lot?: Lot | undefined; rfq?: Rfq | undefined }) {
  const { tx } = useT();
  const buyers = useStore((s) => s.buyers);
  const currency = useStore((s) => s.currency);
  if (!lot) return null;
  const buyer = rfq ? buyers.find((b) => b.id === rfq.buyerId) : undefined;
  const q = rfq?.quotes.at(-1);
  const today = "2026-11-17";
  const version = kind === "proforma" ? `v${q?.version ?? 1}` : "v1.0";
  const approved = canApprove(lot);
  const qty = rfq?.volumeKg ?? lot.weightKg;
  const price = q?.priceEurKg ?? 0;
  const money = (eur: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(fromEur(eur, currency));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="flex-row items-center justify-between pr-8">
          <SheetTitle className="font-display">{kind === "spec" ? "Product Spec Sheet" : "Proforma Invoice"} · {lot.id}</SheetTitle>
          <Button size="sm" variant="outline" onClick={() => { log(lot.id, "doc.export", `${kind} ${version} PDF`); window.print(); }}><Printer className="mr-1 h-4 w-4" />PDF</Button>
        </SheetHeader>
        <div id="print-doc" className="relative mt-4 overflow-hidden rounded-md border bg-card p-8 text-sm">
          {(kind === "proforma" || !approved) && <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-8xl font-bold text-destructive/10 -rotate-12">DRAFT</div>}
          <div className="flex justify-between border-b pb-4">
            <div><div className="font-display text-2xl font-bold">Walnut Export Hub</div><div className="text-xs text-muted-foreground">Agency office: Warsaw, PL · Origin: Kyrgyz Republic</div></div>
            <div className="text-right text-xs"><div>Date: {today}</div><div>Doc version: {version}</div><div>Lot ID: <b>{lot.id}</b></div>{kind === "proforma" && <div className="font-semibold text-destructive">DRAFT – not a binding offer</div>}</div>
          </div>
          {kind === "spec" ? (
            <div className="mt-4 space-y-4">
              <h3 className="font-display text-lg font-bold">Walnut kernels, shelled (HS 0802 32){!approved && <span className="ml-2 text-sm text-warning-foreground">— subject to tests</span>}</h3>
              <table className="w-full text-left"><tbody className="[&_td]:border-b [&_td]:py-1.5">
                <tr><td className="w-1/2 text-muted-foreground">Standard</td><td>UNECE DDP-02 (Walnut kernels)</td></tr>
                <tr><td className="text-muted-foreground">Grade / style</td><td>{lot.grade === "LHP" ? "Light Halves (butterfly)" : lot.grade}</td></tr>
                <tr><td className="text-muted-foreground">Kernel colour</td><td>{lot.color}</td></tr>
                <tr><td className="text-muted-foreground">Crop / origin</td><td>{lot.season} · {lot.region}, Kyrgyzstan</td></tr>
                <tr><td className="text-muted-foreground">Packaging</td><td>{lot.packaging}</td></tr>
                <tr><td className="text-muted-foreground">Net weight available</td><td>{lot.weightKg.toLocaleString()} kg</td></tr>
                <tr><td className="text-muted-foreground">Moisture</td><td>{lot.lab ? `${lot.lab.moisture}% (max 5%)` : "pending"}</td></tr>
                <tr><td className="text-muted-foreground">Aflatoxin B1 / total</td><td>{lot.lab ? `${lot.lab.b1} / ${lot.lab.total} µg/kg (limits 2 / 4, Reg. EU 2023/915)` : "pending"}</td></tr>
                <tr><td className="text-muted-foreground">Laboratory / COA</td><td>{lot.lab ? `${lot.lab.lab} · ${lot.lab.coaFile ?? "—"} · valid to ${lot.lab.validUntil}` : "pending"}</td></tr>
                <tr><td className="text-muted-foreground">Preferential origin</td><td>{lot.gspFormA ? "GSP+ (0% duty) — " + lot.gspFormA : "pending"}</td></tr>
              </tbody></table>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs"><div><div className="text-muted-foreground">Seller (agent)</div>Walnut Export Hub, Warsaw</div><div><div className="text-muted-foreground">Buyer</div>{buyer?.company}<br />{buyer?.contact}</div></div>
              <table className="w-full text-left text-xs"><thead><tr className="border-b"><th className="py-1">Description</th><th>Qty kg</th><th>Price/kg</th><th className="text-right">Amount</th></tr></thead>
                <tbody><tr className="border-b"><td className="py-2">Walnut kernels {lot.grade} {lot.color}, {lot.packaging}, lot {lot.id}</td><td>{qty.toLocaleString()}</td><td>{money(price)}</td><td className="text-right">{money(price * qty)}</td></tr></tbody>
                <tfoot><tr><td colSpan={3} className="pt-2 text-right font-semibold">Total ({rfq?.incoterm === "DAP" ? "DAP Warsaw" : "FCA Bishkek"}, Incoterms® 2020)</td><td className="pt-2 text-right font-bold">{money(price * qty)}</td></tr></tfoot></table>
              <p className="text-xs text-muted-foreground">Payment: 30% prepayment, 70% against documents. VAT and duty excluded. FX {FX.date}, {FX.source}. {tx("Ручное утверждение владельца обязательно.", "Manual owner approval required.")}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
