import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import mayaAsset from "@/assets/maya.jpg.asset.json";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// MANTIDO EXATAMENTE DO PROJETO ATUAL:
// todo clique no CTA passa pelo Railway para criar/transportar o tracking
// antes de redirecionar o visitante ao Telegram.
const TRACKING_REDIRECT_URL = "https://web-production-9d79b.up.railway.app/tracking/telegram/go";

type TrackingPayload = {
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  page_url: string | null;
  referrer: string | null;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"),
  );
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
}

function getTrackingDataNow(): TrackingPayload {
  if (typeof window === "undefined") {
    return { fbclid: null, fbc: null, fbp: null, page_url: null, referrer: null };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get("fbclid") ?? null;

  const fbcCookie = getCookie("_fbc");
  let fbc: string | null = fbcCookie;
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  return {
    fbclid,
    fbc,
    fbp: getCookie("_fbp"),
    page_url: window.location.href || null,
    referrer: document.referrer || null,
  };
}

function buildTrackingRedirectHref(): string {
  const data = getTrackingDataNow();
  const params = new URLSearchParams();

  if (data.fbclid) params.set("fbclid", data.fbclid);
  if (data.fbc) params.set("fbc", data.fbc);
  if (data.fbp) params.set("fbp", data.fbp);
  if (data.page_url) params.set("page_url", data.page_url);
  if (data.referrer) params.set("referrer", data.referrer);

  const query = params.toString();
  return query ? `${TRACKING_REDIRECT_URL}?${query}` : TRACKING_REDIRECT_URL;
}

function useTelegramLink(): { href: string } {
  const [href, setHref] = useState(TRACKING_REDIRECT_URL);

  useEffect(() => {
    setHref(buildTrackingRedirectHref());
  }, []);

  return { href };
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acesso Privado — Maya" },
      {
        name: "description",
        content: "Acesse o espaço privado da Maya pelo Telegram.",
      },
      { property: "og:title", content: "Acesso Privado — Maya" },
      {
        property: "og:description",
        content: "Acesse o espaço privado da Maya pelo Telegram.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function LockedPreview({ src }: { src: string }) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-pink-500/30 bg-zinc-700 sm:h-24 sm:w-24">
      <img
        src={src}
        alt=""
        className="private-blur-card absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex items-center justify-center text-xl text-white">🔒</div>
    </div>
  );
}

function Landing() {
  const { href: telegramHref } = useTelegramLink();

  return (
    <main className="private-landing relative flex min-h-dvh w-full flex-col justify-center overflow-hidden bg-black text-white">
      {/* A foto continua sendo a mesma do projeto atual. */}
      <img
        src={mayaAsset.url}
        alt="Maya"
        fetchPriority="high"
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.08] object-cover object-[center_20%]"
      />

      {/* Mesmo conceito do layout enviado: imagem em destaque em cima e fechamento escuro embaixo. */}
      <div className="private-bg-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-black/15" />

      <section className="relative z-10 mx-auto w-full max-w-2xl px-6 py-10 text-center">
        <h1 className="mb-4 text-5xl font-black leading-none tracking-tighter sm:text-6xl md:text-7xl">
          SÓ PARA
          <br />
          <span className="text-pink-500">OS SAFADOS 😈</span>
        </h1>

        <p className="mx-auto mb-8 max-w-sm text-base font-medium leading-relaxed text-zinc-300 sm:text-lg">
          Sem censura. Sem filtros.
          <br />
          <span className="font-bold text-white">Tudo o que o Insta não deixa postar.</span>
        </p>

        <a
          href={telegramHref}
          onClick={(event) => {
            // IMPORTANTE: preserva o tracking real do projeto atual.
            // Não trocar este trecho por link direto para t.me.
            event.preventDefault();
            const trackingUrl = buildTrackingRedirectHref();
            window.location.assign(trackingUrl);
          }}
          id="btn-vip"
          className="private-btn-glow mx-auto block w-full max-w-sm rounded-2xl bg-pink-600 px-5 py-5 text-xl font-black uppercase tracking-tight text-white transition-all hover:bg-pink-500 active:scale-[0.98] sm:py-6 sm:text-2xl"
        >
          Quero ver tudo agora 🔥
        </a>

        <div className="mt-10 flex justify-center gap-3">
          <LockedPreview src="/preview1.jpg" />
          <LockedPreview src="/preview2.jpg" />
          <LockedPreview src="/preview3.jpg" />
        </div>

        <p className="mt-4 animate-pulse text-xs font-bold uppercase tracking-widest text-pink-400">
          ⚠️ Vagas limitadas com desconto no PIX
        </p>

        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55">
          Acesso restrito a maiores de 18 anos
        </p>
      </section>
    </main>
  );
}
