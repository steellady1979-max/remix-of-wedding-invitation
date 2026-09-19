import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Heart,
  Lock,
  Users,
  UserX,
  MessageCircle,
  LogOut,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { fetchRsvps, deleteRsvp } from "@/lib/admin.functions";

async function exportExcel(rows: Row[]) {
  const XLSX = await import("xlsx");
  const data = rows.map((r) => ({
    "სახელი გვარი": r.full_name,
    სტატუსი: r.attending === "yes" ? "მოვა" : "ვერ ახერხებს",
    სტუმრები: r.guests,
    "+1": r.plus_one_name ?? "",
    შეტყობინება: r.message ?? "",
    თარიღი: new Date(r.created_at).toLocaleString("ka-GE"),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 25 }, { wch: 16 }, { wch: 10 }, { wch: 20 }, { wch: 40 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "RSVP");
  XLSX.writeFile(wb, "iosebi-mariami-rsvp.xlsx");
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "ადმინ პანელი — იოსები & მარიამი" },
      { name: "description", content: "იოსებისა და მარიამის ქორწილის RSVP პასუხების მართვა." },
      { property: "og:title", content: "ადმინ პანელი — იოსები & მარიამი" },
      { property: "og:description", content: "ქორწილის RSVP პასუხების დაცული მართვის გვერდი." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type Row = {
  id: string;
  full_name: string;
  attending: string;
  guests: number;
  plus_one_name?: string | null;
  message: string | null;
  created_at: string;
};

function AdminPage() {
  const fetchFn = useServerFn(fetchRsvps);
  const deleteFn = useServerFn(deleteRsvp);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(k: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn({ data: { key: k } });
      if (!res.ok) {
        setError(
          res.reason === "bad_key"
            ? "არასწორი წვდომის გასაღები"
            : "მონაცემების ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.",
        );
        sessionStorage.removeItem("admin_key");
        setRows(null);
        return;
      }
      setRows(res.rows as Row[]);
      sessionStorage.setItem("admin_key", k);
    } catch {
      setError("არასწორი წვდომის გასაღები");
      sessionStorage.removeItem("admin_key");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_key");
    if (saved) {
      setKey(saved);
      load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id: string, name: string) {
    if (!window.confirm(`დარწმუნებული ხართ, რომ გსურთ „${name}"-ის პასუხის წაშლა?`)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await deleteFn({ data: { key, id } });
      if (!res.ok) {
        setError("წაშლა ვერ მოხერხდა. სცადეთ ხელახლა.");
        return;
      }
      setRows((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    } catch {
      setError("წაშლა ვერ მოხერხდა. სცადეთ ხელახლა.");
    } finally {
      setDeletingId(null);
    }
  }

  function logout() {
    sessionStorage.removeItem("admin_key");
    setKey("");
    setRows(null);
  }

  if (!rows) {
    return (
      <div className="min-h-screen bg-[#FBF8EF] flex items-center justify-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(key);
          }}
          className="w-full max-w-md rounded-3xl border border-[var(--sage)]/40 bg-card/60 backdrop-blur-sm p-8 md:p-10 shadow-[0_25px_60px_rgba(60,80,70,0.18)] text-center"
        >
          <div className="w-14 h-14 rounded-full bg-[var(--sage)]/20 grid place-items-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-[var(--sage-deep)]" strokeWidth={1.5} />
          </div>
          <p className="font-text text-xs tracking-[0.4em] uppercase text-[var(--sage-deep)]/70 mb-3">
            პატარძლის პანელი
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-[var(--sage-deep)] mb-2">
            მხოლოდ შენთვის
          </h1>
          <p className="font-text text-sm text-muted-foreground mb-7">შეიყვანე წვდომის გასაღები</p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-background/70 border border-[var(--sage)]/50 focus:border-[var(--sage-deep)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-deep)]/20 font-text text-base text-foreground text-center tracking-widest"
            placeholder="• • • • • •"
          />
          {error && <p className="mt-3 font-text text-sm text-[var(--rose)]">{error}</p>}
          <button
            type="submit"
            disabled={loading || !key}
            className="mt-6 w-full px-6 py-4 rounded-full bg-[var(--sage-deep)] text-primary-foreground hover:bg-[var(--sage-deep)]/90 transition-colors shadow-[0_10px_25px_rgba(60,80,70,0.25)] font-text text-sm tracking-[0.25em] uppercase disabled:opacity-50"
          >
            {loading ? "..." : "შესვლა"}
          </button>
        </form>
      </div>
    );
  }

  const yes = rows.filter((r) => r.attending === "yes");
  const no = rows.filter((r) => r.attending === "no");
  const totalGuests = yes.reduce((sum, r) => sum + (r.guests || 1), 0);

  return (
    <div className="min-h-screen bg-[#FBF8EF] px-4 py-10 md:py-14">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10 md:mb-14 relative pt-12 sm:pt-0">
          <div className="absolute right-0 top-0 flex gap-2">
            <button
              onClick={() => exportExcel(rows)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--sage-deep)] text-primary-foreground hover:bg-[var(--sage-deep)]/90 transition-colors font-text text-xs tracking-[0.2em] uppercase shadow-[0_8px_20px_rgba(60,80,70,0.25)]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.5} />
              Excel
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--sage-deep)]/30 text-[var(--sage-deep)] hover:bg-[var(--sage)]/15 transition-colors font-text text-xs tracking-[0.2em] uppercase"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              გასვლა
            </button>
          </div>
          <p className="font-text text-xs tracking-[0.4em] uppercase text-[var(--sage-deep)]/70 mb-3">
            იოსები & მარიამი
          </p>
          <h1 className="font-heading text-4xl md:text-6xl text-[var(--sage-deep)]">
            სტუმრების პასუხები
          </h1>
          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="h-px w-12 bg-[var(--sage-deep)]/30" />
            <Heart className="w-4 h-4 text-[var(--rose)]" strokeWidth={1.5} />
            <span className="h-px w-12 bg-[var(--sage-deep)]/30" />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard icon={Users} label="დადასტურდა" value={yes.length} accent="sage-deep" />
          <StatCard icon={UserX} label="ვერ ახერხებენ" value={no.length} accent="rose" />
          <StatCard icon={Heart} label="სტუმარი ჯამში" value={totalGuests} accent="gold" />
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-[var(--rose)]/40 bg-[var(--rose)]/10 px-5 py-3 text-center font-text text-sm text-[var(--rose)]">
            {error}
          </div>
        )}

        <Section
          title="ვინ მოდის"
          subtitle={`${yes.length} პასუხი`}
          rows={yes}
          emptyText="ჯერ პასუხები არ არის"
          tone="yes"
          onDelete={remove}
          deletingId={deletingId}
        />

        <Section
          title="ვინ ვერ ახერხებს"
          subtitle={`${no.length} პასუხი`}
          rows={no}
          emptyText="ყველა ახერხებს ✨"
          tone="no"
          onDelete={remove}
          deletingId={deletingId}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
  accent: "sage-deep" | "rose" | "gold";
}) {
  return (
    <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-[var(--sage)]/40 p-6 shadow-[0_8px_24px_rgba(60,80,70,0.08)] flex items-center gap-4">
      <span className="w-12 h-12 rounded-full bg-background grid place-items-center border border-[var(--sage-deep)]/20 shrink-0">
        <Icon className={`w-5 h-5 text-[var(--${accent})]`} strokeWidth={1.5} />
      </span>
      <div>
        <div className="font-text text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1">
          {label}
        </div>
        <div className="font-heading text-3xl text-[var(--sage-deep)] tabular-nums leading-none">
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  rows,
  emptyText,
  tone,
  onDelete,
  deletingId,
}: {
  title: string;
  subtitle: string;
  rows: Row[];
  emptyText: string;
  tone: "yes" | "no";
  onDelete: (id: string, name: string) => void;
  deletingId: string | null;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-5 px-1">
        <h2 className="font-heading text-2xl md:text-3xl text-[var(--sage-deep)]">{title}</h2>
        <span className="font-text text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          {subtitle}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--sage)]/50 bg-card/40 p-8 text-center font-text text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <ul className="divide-y divide-[var(--sage-deep)]/10 border-y border-[var(--sage-deep)]/10 rounded-2xl bg-card/60 backdrop-blur-sm overflow-hidden">
          {rows.map((r) => (
            <li key={r.id} className="p-5 md:p-6 hover:bg-[var(--sage)]/10 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-heading text-lg md:text-xl text-[var(--sage-deep)]">
                      {r.full_name}
                    </span>
                    {tone === "yes" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--sage)]/25 text-[var(--sage-deep)] font-text text-[10px] tracking-[0.2em] uppercase">
                        <Users className="w-3 h-3" strokeWidth={1.8} />
                        {r.guests} სტუმარი
                      </span>
                    )}
                  </div>
                  {r.plus_one_name && (
                    <p className="mt-2 font-text text-sm text-muted-foreground">
                      +1: {r.plus_one_name}
                    </p>
                  )}
                  {r.message && (
                    <div className="mt-3 flex gap-2 items-start">
                      <MessageCircle
                        className="w-4 h-4 text-[var(--rose)] mt-0.5 shrink-0"
                        strokeWidth={1.5}
                      />
                      <p className="font-text text-sm text-foreground/80 leading-relaxed italic">
                        „{r.message}"
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-text text-[10px] tracking-[0.2em] uppercase text-muted-foreground tabular-nums">
                    {new Date(r.created_at).toLocaleDateString("ka-GE", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(r.id, r.full_name)}
                    disabled={deletingId === r.id}
                    aria-label="წაშლა"
                    title="წაშლა"
                    className="w-9 h-9 rounded-full grid place-items-center border border-[var(--rose)]/40 text-[var(--rose)] hover:bg-[var(--rose)]/10 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
