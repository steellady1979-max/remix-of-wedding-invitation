import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Feather, Loader2 } from "lucide-react";
import { listWishes, submitWish } from "@/lib/sheets.functions";
import { toast } from "sonner";

type Wish = {
  name: string;
  message: string;
  date: string;
};

const pageStyle: React.CSSProperties = {
  backgroundColor: "#fdf7f6",
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent 0px, transparent 33px, rgba(120,110,90,0.14) 33px, rgba(120,110,90,0.14) 34px)",
  backgroundSize: "100% 34px",
};

function Page({ wish, empty }: { wish?: Wish; empty?: string }) {
  return (
    <div
      style={pageStyle}
      className="relative h-full w-full rounded-xl px-5 py-6 sm:px-7 sm:py-8 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_50px_rgba(170,110,120,0.14)]" />
      {wish ? (
        <div className="relative flex h-full flex-col">
          <p className="font-galaktioni text-[19px] sm:text-[22px] leading-[34px] text-[var(--sage-deep)]">
            {wish.name}
          </p>
          <p className="font-text mt-[34px] whitespace-pre-line text-[14px] sm:text-[15px] leading-[34px] text-[#4a443c] break-words">
            {wish.message}
          </p>
          <p className="font-text mt-auto pt-4 text-[10px] tracking-[0.25em] uppercase text-[var(--sage-deep)]/50">
            {wish.date}
          </p>
        </div>
      ) : (
        <div className="relative grid h-full place-items-center text-center">
          <p className="font-text text-sm leading-[34px] text-[var(--sage-deep)]/45">
            {empty ?? ""}
          </p>
        </div>
      )}
    </div>
  );
}

export default function WishBook() {
  const fetchWishes = useServerFn(listWishes);
  const sendWish = useServerFn(submitWish);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [spread, setSpread] = useState(0);
  const [flip, setFlip] = useState<"next" | "prev" | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWishes();
        setWishes(res.wishes);
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const perSpread = 2;
  const totalSpreads = Math.max(1, Math.ceil(wishes.length / perSpread));
  const left = wishes[spread * perSpread];
  const right = wishes[spread * perSpread + 1];

  const go = (dir: "next" | "prev") => {
    if (flip) return;
    const target = dir === "next" ? spread + 1 : spread - 1;
    if (target < 0 || target > totalSpreads - 1) return;
    setFlip(dir);
    setTimeout(() => {
      setSpread(target);
      setFlip(null);
    }, 520);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("გთხოვთ შეავსოთ სახელი და სურვილი");
      return;
    }
    setSending(true);
    try {
      await sendWish({ data: { name: name.trim(), message: message.trim() } });
    } catch {
      setSending(false);
      toast.error("ვერ მოხერხდა გაგზავნა, სცადეთ თავიდან");
      return;
    }
    setSending(false);
    const next = [
      ...wishes,
      { name: name.trim(), message: message.trim(), date: new Date().toLocaleDateString("ka-GE") },
    ];
    setWishes(next);
    setSpread(Math.floor((next.length - 1) / perSpread));
    setName("");
    setMessage("");
    toast.success("თქვენი სურვილი წიგნში ჩაიწერა");
  };

  const inputClass =
    "w-full rounded-2xl border border-[var(--sage)]/50 bg-[#fdf7f6] px-4 py-3 font-text text-[15px] text-foreground placeholder:text-[var(--sage-deep)]/35 outline-none focus:border-[var(--sage-deep)]/60 transition-colors";

  return (
    <section className="w-full max-w-3xl mt-20 md:mt-28 px-1 text-center animate-fade-in-up">
      <p className="font-text text-xs tracking-[0.4em] uppercase text-[var(--sage-deep)]/70 mb-4">
        სტუმრების გვერდი
      </p>
      <h2 className="font-heading text-4xl md:text-5xl text-[var(--sage-deep)] mb-3">
        სურვილების წიგნი
      </h2>
      <p className="font-text text-base text-muted-foreground mb-8 leading-relaxed">
        დაგვიტოვეთ რამდენიმე თბილი სიტყვა — ისინი სამუდამოდ დარჩება ჩვენს წიგნში.
      </p>

      {/* Book */}
      <div
        className="relative mx-auto w-full rounded-[26px] p-3 sm:p-5 shadow-[0_30px_70px_rgba(150,95,110,0.28)]"
        style={{
          background:
            "linear-gradient(145deg, var(--sage-deep), color-mix(in oklab, var(--sage-deep) 78%, black))",
        }}
      >
        <div
          className="relative rounded-[18px] p-2 sm:p-3"
          style={{ background: "color-mix(in oklab, var(--sage-deep) 88%, white)" }}
        >
          <div
            className="relative grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-0"
            style={{ perspective: "1600px" }}
          >
            <div className="min-h-[300px] sm:min-h-[360px] sm:pr-1">
              <Page
                wish={left}
                empty={loading ? "" : "ჯერ არავის დაუწერია სურვილი —\nიყავით პირველი"}
              />
            </div>
            <div className="hidden sm:block sm:min-h-[360px] sm:pl-1">
              <Page wish={right} empty="" />
            </div>

            {/* spine */}
            <div className="pointer-events-none absolute inset-y-2 left-1/2 hidden w-6 -translate-x-1/2 sm:block bg-[linear-gradient(to_right,rgba(90,75,50,0.02),rgba(90,75,50,0.20),rgba(255,255,255,0.55),rgba(90,75,50,0.20),rgba(90,75,50,0.02))]" />

            {/* flipping sheet */}
            {flip && (
              <div
                className="pointer-events-none absolute inset-y-0 z-20 w-full sm:w-1/2"
                style={{
                  left: flip === "next" ? "auto" : 0,
                  right: flip === "next" ? 0 : "auto",
                  transformOrigin: flip === "next" ? "left center" : "right center",
                  transformStyle: "preserve-3d",
                  animation: `${flip === "next" ? "book-flip-next" : "book-flip-prev"} 520ms ease-in-out forwards`,
                }}
              >
                <div style={pageStyle} className="h-full w-full rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]" />
              </div>
            )}
          </div>
        </div>

        {/* controls */}
        <div className="mt-4 flex items-center justify-between gap-3 px-1">
          <button
            type="button"
            onClick={() => go("prev")}
            disabled={spread === 0}
            aria-label="წინა გვერდი"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fdf7f6]/90 text-[var(--sage-deep)] transition-opacity disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <p className="font-text text-[11px] tracking-[0.25em] uppercase text-[#fdf7f6]/80">
            {loading ? "იტვირთება..." : `გვერდი ${spread + 1} / ${totalSpreads}`}
          </p>
          <button
            type="button"
            onClick={() => go("next")}
            disabled={spread >= totalSpreads - 1}
            aria-label="შემდეგი გვერდი"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fdf7f6]/90 text-[var(--sage-deep)] transition-opacity disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* form */}
      <form onSubmit={submit} className="mx-auto mt-8 max-w-xl space-y-4 text-left">
        <div>
          <label className="mb-2 block font-text text-xs tracking-[0.2em] uppercase text-[var(--sage-deep)]/70">
            თქვენი სახელი
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="სახელი გვარი"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-2 block font-text text-xs tracking-[0.2em] uppercase text-[var(--sage-deep)]/70">
            სურვილი
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="დაწერეთ თქვენი სურვილი..."
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[var(--sage-deep)] py-4 font-text text-sm uppercase tracking-[0.25em] text-primary-foreground transition-colors hover:bg-[var(--sage-deep)]/90 disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Feather className="h-4 w-4" strokeWidth={1.5} />}
          {sending ? "იწერება..." : "წიგნში ჩაწერა"}
        </button>
      </form>
    </section>
  );
}
