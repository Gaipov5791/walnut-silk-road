// Pure domain rules (no React). Tested in src/test/domain.test.ts.
export type Role = "owner" | "operator" | "qc" | "buyer";
export type Lang = "ru" | "en";
export type Currency = "EUR" | "USD" | "PLN" | "KGS";
export type LotStatus = "draft" | "sampled" | "tested" | "approved" | "offered" | "reserved" | "sold" | "rejected";
export type Grade = "LHP" | "Quarters" | "Mix" | "Pieces";
export type KernelColor = "Extra Light" | "Light" | "Light Amber" | "Amber";

export const AFLA_B1_MAX = 2; // µg/kg, Reg. (EU) 2023/915
export const AFLA_TOTAL_MAX = 4;

export interface LabResult {
  lab: string; sampledAt: string; validUntil: string;
  b1: number; total: number; moisture: number;
  coaFile?: string | undefined; coaHash?: string | undefined; uploadedBy: Role;
}
export interface Lot {
  id: string; supplierId: string; weightKg: number; season: string; region: string;
  grade: Grade; color: KernelColor; packaging: string; status: LotStatus;
  purchaseKgsPerKg: number; originFile?: string | undefined; gspFormA?: string | undefined;
  lab?: LabResult | undefined; qcApprovedBy?: Role | undefined; photos: number;
}

export interface GateCheck { key: string; ok: boolean; }
export function qualityGate(lot: Lot, today = "2026-11-17"): GateCheck[] {
  const l = lot.lab;
  return [
    { key: "gate.origin", ok: !!lot.originFile },
    { key: "gate.gsp", ok: !!lot.gspFormA },
    { key: "gate.coa", ok: !!l?.coaFile },
    { key: "gate.b1", ok: !!l && l.b1 <= AFLA_B1_MAX },
    { key: "gate.total", ok: !!l && l.total <= AFLA_TOTAL_MAX },
    { key: "gate.valid", ok: !!l && l.validUntil >= today },
    { key: "gate.qc", ok: !!lot.qcApprovedBy },
  ];
}
export const canApprove = (lot: Lot, today?: string) => qualityGate(lot, today).every((c) => c.ok);
/** QC may not be the sole confirmer of data it uploaded itself. */
export const canQcSign = (lot: Lot, role: Role) =>
  (role === "qc" || role === "owner") && !!lot.lab && lot.lab.uploadedBy !== role;

export const NEXT_STATUS: Record<LotStatus, LotStatus[]> = {
  draft: ["sampled", "rejected"], sampled: ["tested", "rejected"], tested: ["approved", "rejected"],
  approved: ["offered", "rejected"], offered: ["reserved", "approved"], reserved: ["sold", "offered"],
  sold: [], rejected: [],
};

export const canSeeMargin = (r: Role) => r === "owner";
export const canSeeSuppliers = (r: Role) => r !== "buyer";
export const canSeePurchase = (r: Role) => r !== "buyer";

// FX: EUR base, fixed rate + date (FR-12: no auto quotes)
export const FX = { date: "2026-11-16", source: "NBKR / NBP / ECB (manual)", rates: { EUR: 1, USD: 1.08, PLN: 4.28, KGS: 94.6 } as Record<Currency, number> };
export const toEur = (v: number, c: Currency, rates = FX.rates) => v / rates[c];
export const fromEur = (v: number, c: Currency, rates = FX.rates) => v * rates[c];

export interface CostInput {
  kg: number; purchaseKgsPerKg: number; sortingKgs: number; packagingKgs: number; labUsd: number;
  localTransportKgs: number; exportDocsUsd: number; tirFreightEur: number; insurancePct: number;
  brokerEur: number; gsp: boolean; vatPct: number; riskPct: number; salePriceEurPerKg: number;
  incoterm: "FCA" | "DAP";
}
export const MFN_DUTY_PCT = 5.1; // HS 080232 MFN; 0% under GSP+
export function landedCost(i: CostInput, rates = FX.rates) {
  const goods = toEur(i.kg * i.purchaseKgsPerKg, "KGS", rates);
  const prep = toEur(i.kg * (i.sortingKgs + i.packagingKgs) + i.localTransportKgs, "KGS", rates) + toEur(i.labUsd + i.exportDocsUsd, "USD", rates);
  const fca = goods + prep;
  const dap = i.incoterm === "DAP";
  const freight = dap ? i.tirFreightEur : 0;
  const insurance = dap ? (fca + freight) * (i.insurancePct / 100) : 0;
  const broker = dap ? i.brokerEur : 0;
  const customsValue = fca + freight + insurance;
  const dutyPct = i.gsp ? 0 : MFN_DUTY_PCT;
  const duty = dap ? customsValue * (dutyPct / 100) : 0;
  const base = fca + freight + insurance + broker + duty;
  const risk = base * (i.riskPct / 100);
  const total = base + risk;
  const vat = dap ? (customsValue + duty) * (i.vatPct / 100) : 0; // shown separately, recoverable
  const revenue = i.kg * i.salePriceEurPerKg;
  const margin = revenue - total;
  return { goods, prep, fca, freight, insurance, broker, duty, dutyPct, risk, total, vat, revenue, margin,
    perKg: i.kg ? total / i.kg : 0, marginPct: revenue ? (margin / revenue) * 100 : 0 };
}

// Append-only audit with hash chain
export function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, "0"); }
