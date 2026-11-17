import { useSyncExternalStore } from "react";
import { hashStr, type Currency, type Lang, type Lot, type LotStatus, type Role } from "./domain";

export interface Supplier { id: string; name: string; region: string; contact: string; phone: string; verified: boolean; inn: string; notes: string; }
export interface Buyer { id: string; company: string; country: string; contact: string; email: string; needs: string; stage: "lead" | "qualified" | "sampling" | "negotiation" | "loi"; history: { date: string; text: string }[]; }
export interface Rfq { id: string; buyerId: string; volumeKg: number; grade: string; packaging: string; incoterm: "FCA" | "DAP"; deadline: string; tests: string; status: "new" | "quoted" | "approved" | "declined"; lotId?: string; quotes: { version: number; priceEurKg: number; date: string; approved: boolean }[]; }
export interface Sample { id: string; lotId: string; buyerId: string; status: "requested" | "shipped" | "delivered" | "feedback"; carrier?: string; tracking?: string; requestedAt: string; feedback?: string; score?: number; result?: "accepted" | "rejected"; }
export interface Audit { id: number; at: string; role: Role; entity: string; action: string; detail: string; hash: string; prev: string; }

export interface State { role: Role; lang: Lang; currency: Currency; suppliers: Supplier[]; lots: Lot[]; buyers: Buyer[]; rfqs: Rfq[]; samples: Sample[]; audit: Audit[]; }

const lab = (b1: number, total: number, by: Role, file = true, valid = "2027-03-01") => ({ lab: "Kyrgyzstandart Lab / Eurofins PL", sampledAt: "2026-10-28", validUntil: valid, b1, total, moisture: 4.2, coaFile: file ? "COA_" + Math.round(b1 * 100) + ".pdf" : undefined, coaHash: file ? "sha256:" + hashStr(String(b1) + total) : undefined, uploadedBy: by });

export function seed(): State {
  const s: State = {
    role: "owner", lang: "ru", currency: "EUR",
    suppliers: [
      { id: "SUP-001", name: "Arslanbob Walnut Coop", region: "Jalal-Abad, Arslanbob", contact: "Нурбек Ташиев", phone: "+996 555 120 344", verified: true, inn: "02104199810123", notes: "Ручная колка, 40 сборщиц" },
      { id: "SUP-002", name: "Kara-Alma Agro", region: "Jalal-Abad, Kara-Alma", contact: "Айгуль Маматова", phone: "+996 700 455 210", verified: true, inn: "01507200510055", notes: "Есть сушильная камера" },
      { id: "SUP-003", name: "Sary-Chelek Farms", region: "Jalal-Abad, Aksy", contact: "Эрлан Садыков", phone: "+996 772 300 118", verified: false, inn: "—", notes: "Ожидает проверку документов" },
      { id: "SUP-004", name: "Osh Nut Trade", region: "Osh, Kara-Suu", contact: "Бахтияр Юсупов", phone: "+996 550 909 771", verified: false, inn: "02201201710009", notes: "Возможна смесь с импортом — проверить происхождение" },
    ],
    lots: [
      { id: "KG-2026-001", supplierId: "SUP-001", weightKg: 4800, season: "2026", region: "Arslanbob", grade: "LHP", color: "Extra Light", packaging: "Vacuum 2×5 kg / carton", status: "approved", purchaseKgsPerKg: 620, originFile: "Origin_Arslanbob.pdf", gspFormA: "GSP_FormA_001.pdf", lab: lab(0.4, 1.1, "operator"), qcApprovedBy: "qc", photos: 6 },
      { id: "KG-2026-002", supplierId: "SUP-002", weightKg: 6200, season: "2026", region: "Kara-Alma", grade: "Quarters", color: "Light", packaging: "Vacuum 2×5 kg / carton", status: "tested", purchaseKgsPerKg: 540, originFile: "Origin_KaraAlma.pdf", gspFormA: "GSP_FormA_002.pdf", lab: lab(1.6, 3.2, "operator"), photos: 4 },
      { id: "KG-2026-003", supplierId: "SUP-001", weightKg: 3000, season: "2026", region: "Arslanbob", grade: "Mix", color: "Light Amber", packaging: "PP bag 25 kg", status: "tested", purchaseKgsPerKg: 470, originFile: "Origin_Arslanbob_2.pdf", gspFormA: undefined, lab: lab(2.7, 5.1, "qc"), photos: 3 },
      { id: "KG-2026-004", supplierId: "SUP-003", weightKg: 2500, season: "2026", region: "Aksy", grade: "LHP", color: "Light", packaging: "Vacuum 2×5 kg / carton", status: "sampled", purchaseKgsPerKg: 600, photos: 2 },
      { id: "KG-2026-005", supplierId: "SUP-002", weightKg: 5000, season: "2026", region: "Kara-Alma", grade: "Pieces", color: "Amber", packaging: "PP bag 25 kg", status: "draft", purchaseKgsPerKg: 380, photos: 1 },
      { id: "KG-2026-006", supplierId: "SUP-001", weightKg: 4000, season: "2026", region: "Arslanbob", grade: "LHP", color: "Extra Light", packaging: "Vacuum 2×5 kg / carton", status: "offered", purchaseKgsPerKg: 640, originFile: "Origin_Arslanbob_3.pdf", gspFormA: "GSP_FormA_006.pdf", lab: lab(0.2, 0.6, "operator"), qcApprovedBy: "qc", photos: 8 },
    ],
    buyers: [
      { id: "BUY-01", company: "Bakalland Trade Sp. z o.o.", country: "PL", contact: "Marta Kowalska", email: "m.kowalska@example.pl", needs: "LHP Extra Light, 10 t/квартал, вакуум", stage: "sampling", history: [{ date: "2026-10-30", text: "Звонок, интерес к LHP" }, { date: "2026-11-05", text: "Запрошен образец 1 кг" }] },
      { id: "BUY-02", company: "Helio Polska S.A.", country: "PL", contact: "Piotr Nowak", email: "p.nowak@example.pl", needs: "Quarters Light для кондитерки", stage: "negotiation", history: [{ date: "2026-11-02", text: "Получена спецификация" }] },
      { id: "BUY-03", company: "NussHaus GmbH", country: "DE", contact: "Lukas Weber", email: "l.weber@example.de", needs: "Mix для выпечки, DAP", stage: "lead", history: [{ date: "2026-11-10", text: "Контакт на выставке" }] },
      { id: "BUY-04", company: "Dutch Nut Hub B.V.", country: "NL", contact: "Sanne de Vries", email: "s.devries@example.nl", needs: "Реэкспорт, 20 т", stage: "qualified", history: [] },
    ],
    rfqs: [
      { id: "RFQ-1001", buyerId: "BUY-01", volumeKg: 4800, grade: "LHP Extra Light", packaging: "Vacuum 2×5 kg", incoterm: "DAP", deadline: "2026-12-10", tests: "Aflatoxin B1/total, moisture, micro", status: "quoted", lotId: "KG-2026-006", quotes: [{ version: 1, priceEurKg: 9.4, date: "2026-11-12", approved: false }] },
      { id: "RFQ-1002", buyerId: "BUY-02", volumeKg: 6000, grade: "Quarters Light", packaging: "Vacuum 2×5 kg", incoterm: "FCA", deadline: "2026-12-20", tests: "Aflatoxin, pesticides", status: "new", quotes: [] },
    ],
    samples: [
      { id: "SMP-01", lotId: "KG-2026-006", buyerId: "BUY-01", status: "feedback", carrier: "DHL Express", tracking: "JD014600009812", requestedAt: "2026-11-05", feedback: "Цвет отличный, вкус свежий, без горечи", score: 9, result: "accepted" },
      { id: "SMP-02", lotId: "KG-2026-002", buyerId: "BUY-02", status: "shipped", carrier: "DHL Express", tracking: "JD014600010377", requestedAt: "2026-11-11" },
      { id: "SMP-03", lotId: "KG-2026-001", buyerId: "BUY-03", status: "requested", requestedAt: "2026-11-15" },
    ],
    audit: [],
  };
  const logs: [Role, string, string, string][] = [
    ["operator", "SUP-001", "create", "Поставщик создан"], ["operator", "KG-2026-001", "create", "Партия 4800 кг"],
    ["operator", "KG-2026-001", "lab.upload", "COA B1 0.4 / total 1.1"], ["qc", "KG-2026-001", "qc.sign", "QC подпись"],
    ["owner", "KG-2026-001", "status", "tested → approved"], ["owner", "RFQ-1001", "quote", "v1 9.40 EUR/kg"],
  ];
  let prev = "00000000"; let id = 1;
  for (const [role, entity, action, detail] of logs) { const at = `2026-11-${String(10 + id).padStart(2, "0")}T09:${10 + id}:00Z`; const hash = hashStr(prev + at + role + entity + action + detail); s.audit.push({ id: id++, at, role, entity, action, detail, hash, prev }); prev = hash; }
  return s;
}

let state: State = seed();
const listeners = new Set<() => void>();
const KEY = "weh-demo-v1";
let hydrated = false;
export function hydrate() { if (hydrated || typeof window === "undefined") return; hydrated = true; try { const raw = localStorage.getItem(KEY); if (raw) { state = { ...seed(), ...JSON.parse(raw) }; listeners.forEach((l) => l()); } } catch { /* ignore */ } }
function commit(next: State) { state = next; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } listeners.forEach((l) => l()); }
export function setState(fn: (s: State) => Partial<State>) { commit({ ...state, ...fn(state) }); }
export function log(entity: string, action: string, detail: string) {
  setState((s) => { const prev = s.audit.at(-1)?.hash ?? "00000000"; const at = new Date().toISOString(); const hash = hashStr(prev + at + s.role + entity + action + detail);
    return { audit: [...s.audit, { id: (s.audit.at(-1)?.id ?? 0) + 1, at, role: s.role, entity, action, detail, hash, prev }] }; });
}
export function resetDemo() { const { role, lang, currency } = state; commit({ ...seed(), role, lang, currency }); }
export function useStore<T>(sel: (s: State) => T): T { return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => sel(state), () => sel(state)); }
export const getState = () => state;
export function updateLot(id: string, patch: Partial<Lot>) { setState((s) => ({ lots: s.lots.map((l) => (l.id === id ? { ...l, ...patch } : l)) })); }
export function setLotStatus(id: string, from: LotStatus, to: LotStatus) { updateLot(id, { status: to }); log(id, "status", `${from} → ${to}`); }
