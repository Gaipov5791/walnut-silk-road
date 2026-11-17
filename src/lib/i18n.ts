import { useStore } from "./store";
import { FX, fromEur, type Currency } from "./domain";

const D = {
  ru: {
    "nav.dashboard": "Обзор", "nav.suppliers": "Поставщики", "nav.lots": "Партии", "nav.buyers": "Покупатели", "nav.rfq": "RFQ и оферты", "nav.calc": "Калькулятор", "nav.samples": "Образцы", "nav.audit": "Журнал аудита", "nav.catalog": "Каталог",
    "role.owner": "Owner EU", "role.operator": "Operator KG", "role.qc": "QC / Consultant", "role.buyer": "Buyer",
    "role.label": "Роль", "demo": "Демо-режим · данные локальные", "reset": "Сбросить демо",
    "gate.origin": "Подтверждение происхождения", "gate.gsp": "Сертификат GSP+ (Form A / REX)", "gate.coa": "Файл COA лаборатории", "gate.b1": "Афлатоксин B1 ≤ 2 мкг/кг", "gate.total": "Сумма афлатоксинов ≤ 4 мкг/кг", "gate.valid": "Анализ актуален", "gate.qc": "Независимая подпись QC",
    "gate.title": "Quality Safety Gate", "gate.blocked": "Статус Approved заблокирован: не выполнены условия", "gate.ok": "Все условия выполнены",
    "hidden.margin": "Маржа ЕС скрыта для вашей роли", "subject": "subject to tests",
    "status": "Статус", "weight": "Вес", "grade": "Сорт", "color": "Цвет ядра", "supplier": "Поставщик", "region": "Регион", "actions": "Действия", "save": "Сохранить", "add": "Добавить", "cancel": "Отмена",
  },
  en: {
    "nav.dashboard": "Overview", "nav.suppliers": "Suppliers", "nav.lots": "Lots", "nav.buyers": "Buyers CRM", "nav.rfq": "RFQ & Quotes", "nav.calc": "Landed cost", "nav.samples": "Samples", "nav.audit": "Audit log", "nav.catalog": "Catalog",
    "role.owner": "Owner EU", "role.operator": "Operator KG", "role.qc": "QC / Consultant", "role.buyer": "Buyer",
    "role.label": "Role", "demo": "Demo mode · local data", "reset": "Reset demo",
    "gate.origin": "Origin evidence", "gate.gsp": "GSP+ certificate (Form A / REX)", "gate.coa": "Lab COA file", "gate.b1": "Aflatoxin B1 ≤ 2 µg/kg", "gate.total": "Total aflatoxins ≤ 4 µg/kg", "gate.valid": "Lab result valid", "gate.qc": "Independent QC sign-off",
    "gate.title": "Quality Safety Gate", "gate.blocked": "Approved is blocked: conditions not met", "gate.ok": "All conditions met",
    "hidden.margin": "EU margin hidden for your role", "subject": "subject to tests",
    "status": "Status", "weight": "Weight", "grade": "Grade", "color": "Kernel colour", "supplier": "Supplier", "region": "Region", "actions": "Actions", "save": "Save", "add": "Add", "cancel": "Cancel",
  },
} as const;
export type TKey = keyof (typeof D)["ru"];

export function useT() {
  const lang = useStore((s) => s.lang);
  const t = (k: TKey) => D[lang][k] ?? k;
  /** inline bilingual helper */
  const tx = (ru: string, en: string) => (lang === "ru" ? ru : en);
  return { t, tx, lang };
}
export function useMoney() {
  const cur = useStore((s) => s.currency);
  const lang = useStore((s) => s.lang);
  const fmt = (eur: number, c: Currency = cur, digits = c === "KGS" ? 0 : 2) =>
    new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-GB", { style: "currency", currency: c, maximumFractionDigits: digits, minimumFractionDigits: digits }).format(fromEur(eur, c));
  return { fmt, cur, fxNote: `FX ${FX.date} · ${FX.source}` };
}
