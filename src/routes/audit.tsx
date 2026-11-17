import { createFileRoute } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { hashStr } from "@/lib/domain";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit log · Walnut Export Hub" }, { name: "description", content: "Append-only, hash-chained audit trail of prices, quality and statuses." }, { property: "og:title", content: "Audit log · Walnut Export Hub" }, { property: "og:description", content: "Append-only audit trail." }] }),
  component: Audit,
});
function Audit() {
  const { t, tx } = useT();
  const audit = useStore((s) => s.audit);
  const intact = audit.every((a, i) => a.prev === (i ? audit[i - 1].hash : "00000000") && a.hash === hashStr(a.prev + a.at + a.role + a.entity + a.action + a.detail));
  return (
    <div>
      <PageHeader title={t("nav.audit")} sub={tx("Только добавление записей. Редактирование недоступно ни одной роли.", "Append-only. No role can edit entries.")}>
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">{intact ? <ShieldCheck className="h-4 w-4 text-success" /> : <Lock className="h-4 w-4 text-destructive" />}{tx("Цепочка хэшей", "Hash chain")}: {intact ? "OK" : "BROKEN"}</div>
      </PageHeader>
      <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr className="[&_th]:px-4 [&_th]:py-3"><th>#</th><th>{tx("Когда", "When")}</th><th>{tx("Кто", "Who")}</th><th>{tx("Объект", "Entity")}</th><th>{tx("Действие", "Action")}</th><th>{tx("Детали", "Details")}</th><th>Hash</th></tr></thead>
        <tbody>{[...audit].reverse().map((a) => <tr key={a.id} className="border-t [&_td]:px-4 [&_td]:py-2"><td className="text-muted-foreground">{a.id}</td><td className="whitespace-nowrap">{a.at.replace("T", " ").slice(0, 16)}</td><td>{a.role}</td><td className="font-mono">{a.entity}</td><td>{a.action}</td><td>{a.detail}</td><td className="font-mono text-xs text-muted-foreground">{a.hash}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
