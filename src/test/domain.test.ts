import { describe, expect, it } from "vitest";
import { canApprove, canQcSign, canSeeMargin, landedCost, type Lot } from "@/lib/domain";
const base: Lot = { id: "L", supplierId: "s", weightKg: 1000, season: "2026", region: "Jalal-Abad", grade: "LHP", color: "Extra Light", packaging: "10 kg", status: "tested", purchaseKgsPerKg: 600, originFile: "o.pdf", gspFormA: "a.pdf", photos: 1, qcApprovedBy: "qc",
  lab: { lab: "X", sampledAt: "2026-11-01", validUntil: "2027-02-01", b1: 1.2, total: 2.5, moisture: 4, coaFile: "c.pdf", uploadedBy: "operator" } };
describe("quality gate", () => {
  it("approves when all checks pass", () => expect(canApprove(base)).toBe(true));
  it("blocks without COA file (AT-02)", () => expect(canApprove({ ...base, lab: { ...base.lab!, coaFile: undefined } })).toBe(false));
  it("blocks B1 above 2", () => expect(canApprove({ ...base, lab: { ...base.lab!, b1: 2.1 } })).toBe(false));
  it("blocks total above 4", () => expect(canApprove({ ...base, lab: { ...base.lab!, total: 4.2 } })).toBe(false));
  it("blocks without GSP+ origin", () => expect(canApprove({ ...base, gspFormA: undefined })).toBe(false));
  it("QC cannot sign own upload", () => expect(canQcSign({ ...base, lab: { ...base.lab!, uploadedBy: "qc" } }, "qc")).toBe(false));
});
describe("RBAC", () => { it("operator cannot see margin (AT-01)", () => expect(canSeeMargin("operator")).toBe(false)); });
describe("landed cost", () => {
  it("GSP+ gives zero duty", () => {
    const r = landedCost({ kg: 1000, purchaseKgsPerKg: 600, sortingKgs: 0, packagingKgs: 0, labUsd: 0, localTransportKgs: 0, exportDocsUsd: 0, tirFreightEur: 0, insurancePct: 0, brokerEur: 0, gsp: true, vatPct: 5, riskPct: 0, salePriceEurPerKg: 8, incoterm: "DAP" }, { EUR: 1, USD: 1, PLN: 1, KGS: 100 });
    expect(r.duty).toBe(0); expect(r.total).toBe(6000); expect(r.margin).toBe(2000);
  });
});
