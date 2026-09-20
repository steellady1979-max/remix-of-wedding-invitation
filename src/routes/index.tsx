import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GlassWater, UtensilsCrossed, MapPin, ChevronDown, Church, Volume2, VolumeX, CalendarPlus, Check, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import WishBook from "@/components/WishBook";
import { submitRsvp } from "@/lib/sheets.functions";
import weddingVideoAsset from "@/assets/wedding-intro.mp4";
import coupleNewAsset from "@/assets/couple-elene-shota.png";
import dinnerVenueAsset from "@/assets/dinner-venue.jpg";

import envelopeAsset from "@/assets/envelope-card-clean.png";
import churchArtAsset from "@/assets/church-saguramo-art.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ელენე & შოთი — ქორწილის მოსაწვევი" },
      { name: "description", content: "3 ოქტომბერი, 2026 — ილია მართლის ტაძარი და Hotel Pool Emocia, ნატახტარი" },
      { property: "og:title", content: "ელენე & შოთი" },
      { property: "og:description", content: "3 ოქტომბერი, 2026 — ილია მართლის ტაძარი და Hotel Pool Emocia, ნატახტარი" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "ელენე & შოთი" },
      { name: "twitter:description", content: "3 ოქტომბერი, 2026 — ილია მართლის ტაძარი და Hotel Pool Emocia, ნატახტარი" },
    ],
  }),
  component: Invitation,
});

const WEDDING_DATE = new Date("2026-10-03T16:00:00+04:00").getTime();

function useCountdown() {
  // Start with null so SSR and the first client render match; start ticking after hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return { days: null, hours: null, minutes: null, seconds: null };
  const diff = Math.max(0, WEDDING_DATE - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const minutes = Math.floor((diff / 60000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const MUSIC_VIDEO_ID = "MqazV4hbu8E";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    }
  });
  return ytApiPromise;
}

// Root-level persistent music: mounted once, never unmounts while the page lives,
// so playback continues seamlessly from the intro into the landing page.
function BackgroundMusic({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  // Mount the player once. Starts muted (browser-safe autoplay), then attempts
  // an immediate programmatic unmute inside the same split-second window.
  useEffect(() => {
    let cancelled = false;
    // Wake a silent Web Audio context — warms the browser's autoplay permission
    // so the unmute below feels automatic rather than blocked.
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.resume().catch(() => undefined);
      }
    } catch {
      /* noop */
    }

    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: MUSIC_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: MUSIC_VIDEO_ID,
          controls: 0,
          playsinline: 1,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e: any) => {
            try {
              e.target.mute();
              e.target.setVolume(85);
              e.target.playVideo();
              // Silent-to-sound: unmute right after the muted start lands.
              setTimeout(() => {
                try {
                  if (playingRef.current) e.target.unMute();
                  e.target.playVideo();
                } catch {
                  /* blocked — the pointer listener below will unmute */
                }
              }, 250);
            } catch {
              /* noop */
            }
          },
          onStateChange: (e: any) => {
            // Ensure the loop keeps playing
            if (e.data === 0 /* ended */) {
              try {
                e.target.playVideo();
              } catch {
                /* noop */
              }
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
  }, []);

  // Hidden interaction listener: first tap/scroll/key anywhere unmutes + resumes.
  useEffect(() => {
    const unlock = () => {
      const p = playerRef.current;
      if (!p || !playingRef.current) return;
      try {
        p.unMute();
        p.setVolume(85);
        p.playVideo();
      } catch {
        /* noop */
      }
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Reflect toggle state into the player
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (playing) {
        p.unMute();
        p.playVideo();
      } else {
        p.pauseVideo();
      }
    } catch {
      /* noop */
    }
  }, [playing]);

  return (
    <>
      <div className="fixed -z-10 opacity-0 pointer-events-none w-px h-px overflow-hidden" aria-hidden>
        <div ref={hostRef} />
      </div>
      <button
        onClick={onToggle}
        aria-label={playing ? "მუსიკის გამორთვა" : "მუსიკის ჩართვა"}
        className="fixed bottom-5 right-5 z-50 grid place-items-center w-11 h-11 rounded-full bg-card/80 backdrop-blur-sm border border-[var(--sage-deep)]/25 text-[var(--sage-deep)] shadow-[0_8px_24px_rgba(150,95,110,0.18)]"
      >
        {playing ? <Volume2 className="w-5 h-5" strokeWidth={1.5} /> : <VolumeX className="w-5 h-5" strokeWidth={1.5} />}
      </button>
    </>
  );
}


function RevealImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-3xl border border-[var(--sage)]/50 shadow-[0_25px_60px_rgba(150,95,110,0.18)] transition-all duration-[1400ms] ease-out ${
        shown ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-10 blur-[6px]"
      } ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`w-full h-auto transition-transform duration-[2600ms] ease-out ${shown ? "scale-100" : "scale-110"}`}
      />
    </div>
  );
}

function Invitation() {
  const [introDone, setIntroDone] = useState(false);
  const [music, setMusic] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    // Intro plays only on the first visit of the session
    if (typeof window !== "undefined" && sessionStorage.getItem("intro-played") === "1") {
      setIntroDone(true);
    }
    setMusic(true);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background transition-colors duration-500">
      <Details />
      <BackgroundMusic playing={music} onToggle={() => setMusic((m) => !m)} />
      {!introDone ? (
        <IntroVideo
          onFinish={() => {
            sessionStorage.setItem("intro-played", "1");
            setIntroDone(true);
          }}
        />
      ) : null}
    </div>
  );
}

function IntroVideo({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onFinish, 900);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Try to start with sound; if the browser blocks it, fall back to muted
    // autoplay and unmute on the first hidden interaction.
    v.muted = false;
    v.volume = 1;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => undefined);
    });
    const onTap = () => {
      v.muted = false;
      v.volume = 1;
      v.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", onTap);
    window.addEventListener("touchstart", onTap);
    return () => {
      window.removeEventListener("pointerdown", onTap);
      window.removeEventListener("touchstart", onTap);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black transition-all duration-[900ms] ease-out ${
        leaving ? "opacity-0 -translate-y-6 pointer-events-none" : "opacity-100 translate-y-0"
      }`}
    >
      <video
        ref={videoRef}
        src={weddingVideoAsset}
        autoPlay
        muted
        playsInline
        loop={false}
        preload="auto"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        onEnded={finish}
        onError={finish}
        className="w-full h-full object-cover [&::-webkit-media-controls]:hidden"
      />
    </div>
  );
}





function useTypewriter(text: string, active: boolean, speed = 28, delay = 0) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) return;
    let i = 0;
    let id: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      id = setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(id);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [text, active, speed, delay]);
  return out;
}

const ENV_TITLE = "THE BEGINNING OF FOREVER";
const ENV_BODY =
  `ჩვენი სიყვარულის ახალი დასაწყისი.

სიხარულით გიწვევთ ჩვენი ქორწილის აღსანიშნავად. გვინდა, ეს განსაკუთრებული დღე თქვენთან ერთად გავიზიაროთ და ჩვენი ბედნიერების თანამონაწილეები გახდეთ.

თქვენი დასწრება ჩვენი დღის ყველაზე ლამაზი ნაწილი იქნება.`;
const ENV_SIGN = "სიყვარულით, ელენე და შოთი";

function EnvelopeMessage() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // English title appears at once (a gentle fade), Georgian text then types out.
  const body = useTypewriter(ENV_BODY, active, 22, 700);
  const sign = useTypewriter(ENV_SIGN, active, 55, 700 + ENV_BODY.length * 22 + 500);

  return (
    <section ref={ref} className="w-full mt-20 md:mt-28 flex justify-center">
      <div className="relative w-[min(94vw,560px)]">
        <img
          src={envelopeAsset}
          alt="მოსაწვევი კონვერტი"
          className="w-full h-auto select-none pointer-events-none drop-shadow-[0_20px_45px_rgba(150,95,110,0.18)]"
        />
        <div className="absolute inset-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-[19%] w-[68%] text-center">
            <p
              className={`font-english uppercase tracking-[0.22em] text-[3.4vw] sm:text-[16px] md:text-[19px] leading-[1.35] text-[#6d3b44] min-h-[1.35em] transition-opacity duration-700 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              {ENV_TITLE}
            </p>
            <p className="font-text whitespace-pre-line text-[2.55vw] sm:text-[12px] md:text-[13.5px] leading-[1.7] text-[#4a443c] mt-[4%]">
              {body}
            </p>
            <p className="font-heading text-[3vw] sm:text-[14px] md:text-[16px] leading-[1.5] text-[#8a1a20] mt-[5%] min-h-[1.5em]">
              {sign}
            </p>
          </div>


        </div>
      </div>
    </section>
  );
}

function Details() {
  const t = useCountdown();
  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-12 md:py-16 animate-in fade-in duration-1000">

      <header className="text-center max-w-3xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <h1 className="font-heading text-6xl md:text-8xl leading-[1.05] text-[var(--sage-deep)]">
          ელენე
          <span className="block text-3xl md:text-5xl my-2 text-[var(--gold)] animate-gentle-float" style={{ animationDelay: "1.2s" }}>&</span>
          შოთი
        </h1>
        <div className="flex items-center justify-center gap-4 mt-8 mb-4">
          <span className="h-px w-16 md:w-24 bg-[var(--sage-deep)]/40" />
          <p className="font-text text-base md:text-lg tracking-[0.25em] uppercase text-foreground/80">
            03 · 10 · 2026
          </p>
          <span className="h-px w-16 md:w-24 bg-[var(--sage-deep)]/40" />
        </div>
      </header>

      <img
        src={coupleNewAsset}
        alt="ელენე და შოთი"
        className="w-[min(80vw,380px)] h-auto my-8 md:my-10 drop-shadow-[0_15px_30px_rgba(150,95,110,0.15)] animate-fade-in-up"
        style={{ animationDelay: "220ms" }}
      />

      <section className="w-full max-w-3xl text-center animate-fade-in-up" style={{ animationDelay: "360ms" }}>
        <p className="font-text text-sm tracking-[0.35em] uppercase text-[var(--sage-deep)]/70 mb-6">
          დარჩა
        </p>
        <div className="grid grid-cols-4 gap-3 md:gap-6 max-w-2xl mx-auto">
          {[
            { v: t.days, l: "დღე" },
            { v: t.hours, l: "საათი" },
            { v: t.minutes, l: "წუთი" },
            { v: t.seconds, l: "წამი" },
          ].map((u, i) => (
            <div
              key={u.l}
              className="rounded-2xl bg-card/60 backdrop-blur-sm border border-[var(--sage)]/40 py-4 md:py-6 shadow-[0_8px_24px_rgba(150,95,110,0.08)] animate-fade-in-up"
              style={{ animationDelay: `${420 + i * 90}ms` }}
            >
              <div className="font-heading text-3xl md:text-5xl text-[var(--sage-deep)] tabular-nums">
                {u.v === null ? "--" : String(u.v).padStart(2, "0")}
              </div>
              <div className="font-text text-[10px] md:text-xs tracking-[0.2em] uppercase text-muted-foreground mt-1">
                {u.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      <EnvelopeMessage />


      <section className="w-full max-w-5xl mt-20 md:mt-28 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
        <div className="text-center mb-10">
          <p className="font-text text-xs tracking-[0.4em] uppercase text-[var(--sage-deep)]/70 mb-4">
            დღის განრიგი
          </p>
          <h2 className="font-heading text-4xl md:text-5xl text-[var(--sage-deep)]">
            ჩვენი დღე
          </h2>
        </div>

        {/* Minimal collapsible timeline */}
        <div className="max-w-2xl mx-auto divide-y divide-[var(--sage-deep)]/15 border-y border-[var(--sage-deep)]/15">
          {[
            { time: "16:00", icon: Church, title: "ჯვრისწერა", sub: "ილია მართლის სახელობის ტაძარი", desc: "ჩვენი სიყვარულის ოფიციალური დასაწყისი — ჯვრისწერა ილია მართლის სახელობის ტაძარში, ოჯახისა და ახლობლების გარემოცვაში.", map: "https://maps.app.goo.gl/MXbWbkSr4vYSyrfQ9?g_st=ic" },
            { time: "17:00", icon: GlassWater, title: "ხელის მოწერის ცერემონია", sub: "ილია მართლის სახელობის ტაძარი", desc: "ჯვრისწერის შემდეგ, იქვე გაიმართება ხელის მოწერის ცერემონია.", map: "https://maps.app.goo.gl/MXbWbkSr4vYSyrfQ9?g_st=ic" },
            { time: "18:00", icon: UtensilsCrossed, title: "ვახშამი", sub: "Hotel Pool Emocia, ნატახტარი", desc: "დახვეწილი საღამო, გემრიელი მენიუ, მუსიკა და დაუვიწყარი მოგონებები ნატახტარში.", map: "https://maps.app.goo.gl/8L3QGvDhSGaWb8TNA?g_st=ic" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <details key={i} className="group animate-fade-in-up" style={{ animationDelay: `${620 + i * 110}ms` }}>
                <summary className="flex items-center gap-4 py-5 cursor-pointer list-none select-none hover:bg-[var(--sage)]/10 transition-colors px-2 rounded-md">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-background border border-[var(--sage-deep)]/25 shrink-0">
                    <Icon className="w-4 h-4 text-[var(--sage-deep)]" strokeWidth={1.5} />
                  </span>
                  <span className="font-heading text-lg md:text-xl text-[var(--gold)] tabular-nums w-16 shrink-0">
                    {item.time}
                  </span>
                  <span className="font-heading text-base md:text-lg text-[var(--sage-deep)] flex-1 text-left leading-tight">
                    {item.title}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[var(--sage-deep)]/60 transition-transform duration-300 group-open:rotate-180 shrink-0" strokeWidth={1.5} />
                </summary>
                <div className="pl-16 pr-4 pb-5 text-left animate-in fade-in slide-in-from-top-1 duration-300">
                  <p
                    className={`text-[11px] tracking-[0.2em] uppercase text-[var(--rose)] mb-2 ${
                      /[A-Za-z]/.test(item.sub) ? "font-english" : "font-text"
                    }`}
                  >
                    {item.sub}
                  </p>
                  <p className="font-text text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                  <a
                    href={item.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-[var(--sage-deep)] hover:opacity-80 transition-opacity"
                  >
                    <MapPin className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    <span className="font-text text-xs tracking-[0.2em] uppercase">რუკაზე ნახვა</span>
                  </a>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section className="w-full max-w-3xl text-center mt-20 md:mt-28 animate-fade-in-up" style={{ animationDelay: "600ms" }}>
        <p className="font-text text-xs tracking-[0.4em] uppercase text-[var(--sage-deep)]/70 mb-4">
          ჯვრისწერა
        </p>
        <h2 className="font-heading text-4xl md:text-5xl text-[var(--sage-deep)] mb-3">
          ილია მართლის სახელობის ტაძარი
        </h2>
        <p className="font-text text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
          16:00 ჯვრისწერა · 17:00 ხელის მოწერის ცერემონია
        </p>

        <RevealImage
          src={churchArtAsset}
          alt="ილია მართლის სახელობის ტაძარი"
          className="mb-8"
        />

        <div className="relative rounded-[28px] p-[6px] bg-[linear-gradient(140deg,color-mix(in_oklab,var(--sage)_45%,transparent),transparent_45%,color-mix(in_oklab,var(--gold)_35%,transparent))] shadow-[0_30px_70px_rgba(150,95,110,0.22)]">
          <div className="relative rounded-[22px] overflow-hidden border border-[var(--sage)]/40 bg-card">
            <div className="flex items-center gap-3 px-5 py-4 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--sage)_18%,transparent),transparent)] border-b border-[var(--sage)]/25">
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-[var(--sage-deep)]/10 text-[var(--sage-deep)] ring-1 ring-[var(--sage)]/40">
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 text-left">
                <p className="font-text text-[10px] tracking-[0.25em] uppercase text-[var(--sage-deep)]/60">მისამართი</p>
                <p className="font-heading text-sm text-[var(--sage-deep)] truncate">ილია მართლის სახელობის ტაძარი</p>
              </div>
            </div>
            <div className="relative">
              <iframe
                title="St Ilia the Righteous Church"
                src="https://www.google.com/maps?q=St+Ilia+the+Righteous+Church+Saguramo&output=embed"
                className="w-full h-[280px] md:h-[380px] grayscale-[25%] sepia-[15%] contrast-[1.03]"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_45px_rgba(150,95,110,0.20)]" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <a
            href="https://maps.app.goo.gl/MXbWbkSr4vYSyrfQ9?g_st=ic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-7 py-4 rounded-full bg-[var(--sage-deep)] text-primary-foreground hover:bg-[var(--sage-deep)]/90 transition-colors shadow-[0_10px_25px_rgba(150,95,110,0.25)]"
          >
            <MapPin className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            <span className="font-text text-sm tracking-[0.25em] uppercase">რუკაზე ნახვა</span>
          </a>
        </div>

        {/* Restaurant location */}
        <div className="mt-16 md:mt-20 text-center">
          <p className="font-text text-xs tracking-[0.4em] uppercase text-[var(--sage-deep)]/70 mb-4">
            ლოკაცია
          </p>
          <h3 className="font-english text-3xl md:text-4xl tracking-[0.06em] text-[var(--sage-deep)] mb-3">
            Hotel Pool Emocia
          </h3>
          <p className="font-text text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
            ვახშამი 18:00 · ნატახტარი, საქართველო
          </p>

          <RevealImage
            src={dinnerVenueAsset}
            alt="Hotel Pool Emocia — ვახშმის ლოკაცია"
            className="mb-8"
          />

          <div className="relative rounded-[28px] p-[6px] bg-[linear-gradient(140deg,color-mix(in_oklab,var(--sage)_45%,transparent),transparent_45%,color-mix(in_oklab,var(--gold)_35%,transparent))] shadow-[0_30px_70px_rgba(150,95,110,0.22)]">
            <div className="relative rounded-[22px] overflow-hidden border border-[var(--sage)]/40 bg-card">
              <div className="flex items-center gap-3 px-5 py-4 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--sage)_18%,transparent),transparent)] border-b border-[var(--sage)]/25">
                <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-[var(--sage-deep)]/10 text-[var(--sage-deep)] ring-1 ring-[var(--sage)]/40">
                  <UtensilsCrossed className="w-4 h-4" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 text-left">
                  <p className="font-text text-[10px] tracking-[0.25em] uppercase text-[var(--sage-deep)]/60">მისამართი</p>
                  <p className="font-heading text-sm text-[var(--sage-deep)] truncate"><span className="font-english">Hotel Pool Emocia</span>, ნატახტარი</p>
                </div>
              </div>
              <div className="relative">
                <iframe
                  title="Hotel Pool Emocia"
                  src="https://www.google.com/maps?q=Hotel+Pool+Emocia+Natakhtari&output=embed"
                  className="w-full h-[300px] md:h-[420px] grayscale-[25%] sepia-[15%] contrast-[1.03]"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_45px_rgba(150,95,110,0.20)]" />
              </div>
              <div className="px-5 py-3 bg-[var(--sage)]/8 border-t border-[var(--sage)]/25">
                <p className="font-text text-xs text-muted-foreground">ნატახტარი, საქართველო</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <a
              href="https://maps.app.goo.gl/8L3QGvDhSGaWb8TNA?g_st=ic"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-7 py-4 rounded-full bg-[var(--sage-deep)] text-primary-foreground hover:bg-[var(--sage-deep)]/90 transition-colors shadow-[0_10px_25px_rgba(150,95,110,0.25)]"
            >
              <MapPin className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              <span className="font-text text-sm tracking-[0.25em] uppercase">რუკაზე ნახვა</span>
            </a>
          </div>
        </div>

      </section>

      <RSVPSection />

      <WishBook />




      <footer className="mt-16 md:mt-24 text-center px-4 animate-fade-in-up" style={{ animationDelay: "840ms" }}>
        <p className="font-galaktioni text-3xl md:text-5xl text-[var(--gold)] leading-tight">
          გელოდებით ჩვენთვის
          <span className="block">უმნიშვნელოვანეს დღეზე</span>
        </p>
      </footer>

      <Toaster position="top-center" />
    </div>
  );
}


const CAL_START = "20261003T120000Z"; // 16:00 Tbilisi
const CAL_END = "20261003T190000Z";
const CAL_TITLE = "ელენე & შოთის ქორწილი";
const CAL_LOCATION = "ილია მართლის სახელობის ტაძარი / Hotel Pool Emocia, ნატახტარი";
const CAL_DETAILS = "16:00 ჯვრისწერა · 17:00 ხელის მოწერის ცერემონია · 18:00 ვახშამი";

function googleCalendarUrl() {
  const u = new URL("https://calendar.google.com/calendar/render");
  u.searchParams.set("action", "TEMPLATE");
  u.searchParams.set("text", CAL_TITLE);
  u.searchParams.set("dates", `${CAL_START}/${CAL_END}`);
  u.searchParams.set("details", CAL_DETAILS);
  u.searchParams.set("location", CAL_LOCATION);
  return u.toString();
}


function RSVPSection() {
  const sendRsvp = useServerFn(submitRsvp);
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);
  const [fullName, setFullName] = useState("");
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!attending) return toast.error("გთხოვთ აირჩიოთ პასუხი");
    if (fullName.trim().length < 2) return toast.error("გთხოვთ მიუთითოთ სახელი და გვარი");
    if (attending === "yes" && hasPlusOne && plusOneName.trim().length < 2)
      return toast.error("გთხოვთ მიუთითოთ თანმხლების სახელი და გვარი");

    setLoading(true);
    try {
      await sendRsvp({
        data: {
          fullName: fullName.trim(),
          attending,
          guests: attending === "yes" ? (hasPlusOne ? 2 : 1) : 0,
          plusOneName: attending === "yes" && hasPlusOne ? plusOneName.trim() : null,
          message: message.trim() || null,
        },
      });
      setDone(true);
      toast.success("მადლობა! თქვენი პასუხი მიღებულია");
    } catch {
      toast.error("ვერ გაიგზავნა, სცადეთ ხელახლა");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-[var(--sage)]/50 bg-card px-5 py-4 font-text text-base text-foreground outline-none focus:border-[var(--sage-deep)] transition-colors";

  return (
    <section className="mt-20 md:mt-28 px-4 max-w-2xl mx-auto text-center">
      <h3 className="font-galaktioni text-4xl md:text-5xl text-[var(--gold)] mb-8">შეძლებთ მობრძანებას?</h3>

      {done ? (
        <div className="rounded-3xl border border-[var(--sage)]/40 bg-card p-8 shadow-[0_25px_60px_rgba(150,95,110,0.15)]">
          <p className="font-heading text-2xl text-[var(--sage-deep)] mb-3">მადლობა პასუხისთვის</p>
          <p className="font-text text-muted-foreground">
            {attending === "yes" ? "გელოდებით ჩვენთვის უმნიშვნელოვანეს დღეზე!" : "სამწუხაროა, მაგრამ გმადლობთ, რომ გვაცნობეთ."}
          </p>
          {attending === "yes" && (
            <a
              href={googleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[var(--sage-deep)]/40 text-[var(--sage-deep)] hover:bg-[var(--sage)]/15 transition-colors"
            >
              <CalendarPlus className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span className="font-text text-xs tracking-[0.2em] uppercase">დაამატე კალენდარში</span>
            </a>
          )}
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="rounded-3xl border border-[var(--sage)]/40 bg-card p-6 md:p-8 text-left space-y-5 shadow-[0_25px_60px_rgba(150,95,110,0.15)]"
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAttending("yes")}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 font-text text-sm transition-colors border ${
                attending === "yes"
                  ? "bg-[var(--sage-deep)] text-primary-foreground border-transparent"
                  : "border-[var(--sage-deep)]/40 text-[var(--sage-deep)] hover:bg-[var(--sage)]/15"
              }`}
            >
              <Check className="w-4 h-4" strokeWidth={1.5} /> დიახ
            </button>
            <button
              type="button"
              onClick={() => setAttending("no")}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 font-text text-sm transition-colors border ${
                attending === "no"
                  ? "bg-[var(--sage-deep)] text-primary-foreground border-transparent"
                  : "border-[var(--sage-deep)]/40 text-[var(--sage-deep)] hover:bg-[var(--sage)]/15"
              }`}
            >
              <X className="w-4 h-4" strokeWidth={1.5} /> სამწუხაროდ ვერ
            </button>
          </div>

          <div>
            <label className="block font-text text-xs tracking-[0.2em] uppercase text-[var(--sage-deep)]/70 mb-2">
              სახელი და გვარი
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="სახელი გვარი"
              maxLength={120}
              className={inputClass}
            />
          </div>

          {attending === "yes" && (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPlusOne}
                  onChange={(e) => setHasPlusOne(e.target.checked)}
                  className="w-5 h-5 accent-[var(--sage-deep)]"
                />
                <span className="font-text text-sm text-foreground">+1 (თანმხლებთან ერთად მოვდივარ)</span>
              </label>

              {hasPlusOne && (
                <div>
                  <label className="block font-text text-xs tracking-[0.2em] uppercase text-[var(--sage-deep)]/70 mb-2">
                    თანმხლების სახელი და გვარი
                  </label>
                  <input
                    value={plusOneName}
                    onChange={(e) => setPlusOneName(e.target.value)}
                    placeholder="სახელი გვარი"
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-text text-xs tracking-[0.2em] uppercase text-[var(--sage-deep)]/70 mb-2">
              სურვილი (სურვილისამებრ)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--sage-deep)] text-primary-foreground py-4 font-text text-sm tracking-[0.25em] uppercase hover:bg-[var(--sage-deep)]/90 transition-colors disabled:opacity-60"
          >
            {loading ? "იგზავნება..." : "დადასტურება"}
          </button>
        </form>
      )}

    </section>
  );
}
