import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import mayaAsset from "@/assets/maya.jpg.asset.json";

type CollectedMetaParams = Record<string, unknown> & {
  _fbp?: unknown;
  fbp?: unknown;
  _fbc?: unknown;
  fbc?: unknown;
};

type ClientParamBuilder = {
  processAndCollectAllParams?: (url?: string | null) => unknown;
  processAndCollectParams?: (url?: string | null) => CollectedMetaParams | null | undefined;
  getFbp?: () => string | null | undefined;
  getFbc?: () => string | null | undefined;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    clientParamBuilder?: ClientParamBuilder;
  }
}

// Todo clique no CTA passa pelo Railway para criar/transportar o tracking
// antes do redirecionamento ao Telegram.
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

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function runMetaBuilderWarmup(): void {
  if (typeof window === "undefined") return;

  const builder = window.clientParamBuilder;
  if (!builder) return;

  try {
    if (typeof builder.processAndCollectAllParams === "function") {
      // Padrão usado pelas integrações oficiais da Meta: processa sem bloquear
      // o CTA. O resultado útil é lido no clique por cookie/retorno/getFbp.
      builder.processAndCollectAllParams(window.location.href);
      return;
    }

    if (typeof builder.processAndCollectParams === "function") {
      builder.processAndCollectParams(window.location.href);
    }
  } catch {
    // Tracking nunca pode impedir a landing de funcionar.
  }
}

function collectMetaIdsNow(): { fbp: string | null; fbc: string | null } {
  if (typeof window === "undefined") {
    return { fbp: null, fbc: null };
  }

  const builder = window.clientParamBuilder;
  let collected: CollectedMetaParams = {};

  if (builder) {
    try {
      // A própria integração oficial Meta/Facebook for WooCommerce usa
      // processAndCollectParams() e aproveita o objeto retornado diretamente.
      // Isso evita depender somente de o cookie já ter sido persistido.
      if (typeof builder.processAndCollectParams === "function") {
        const result = builder.processAndCollectParams(window.location.href);
        if (result && typeof result === "object") {
          collected = result;
        }
      } else if (typeof builder.processAndCollectAllParams === "function") {
        builder.processAndCollectAllParams(window.location.href);
      }
    } catch {
      // Segue para os fallbacks abaixo.
    }
  }

  let builderFbp: string | null = null;
  let builderFbc: string | null = null;

  if (builder) {
    try {
      if (typeof builder.getFbp === "function") {
        builderFbp = asNonEmptyString(builder.getFbp());
      }
    } catch {
      builderFbp = null;
    }

    try {
      if (typeof builder.getFbc === "function") {
        builderFbc = asNonEmptyString(builder.getFbc());
      }
    } catch {
      builderFbc = null;
    }
  }

  // Mesma prioridade usada pela integração oficial da Meta:
  // cookie real -> valor retornado pelo Parameter Builder -> getter do Builder.
  const fbp =
    getCookie("_fbp") ||
    asNonEmptyString(collected._fbp) ||
    asNonEmptyString(collected.fbp) ||
    builderFbp;

  const fbc =
    getCookie("_fbc") ||
    asNonEmptyString(collected._fbc) ||
    asNonEmptyString(collected.fbc) ||
    builderFbc;

  return { fbp, fbc };
}

function getTrackingDataNow(): TrackingPayload {
  if (typeof window === "undefined") {
    return {
      fbclid: null,
      fbc: null,
      fbp: null,
      page_url: null,
      referrer: null,
    };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get("fbclid") || null;
  const { fbp, fbc } = collectMetaIdsNow();

  return {
    fbclid,
    fbc,
    fbp,
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
    runMetaBuilderWarmup();
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
    <div className="relative h-[clamp(88px,28vw,128px)] w-[clamp(88px,28vw,128px)] overflow-hidden rounded-2xl border border-pink-500/30 bg-zinc-700">
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: "blur(2px)",
          transform: "scale(1.03)",
        }}
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-0 flex items-center justify-center text-2xl text-white drop-shadow-lg">
        🔒
      </div>
    </div>
  );
}

function Landing() {
  const { href: telegramHref } = useTelegramLink();

  return (
    <main className="private-landing relative flex min-h-dvh w-full flex-col justify-center overflow-hidden bg-black text-white">
      <img
        src={mayaAsset.url}
        alt="Maya"
        fetchPriority="high"
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.08] object-cover object-[center_20%]"
      />

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
            // Coleta novamente no clique usando o mesmo padrão da integração
            // oficial da Meta, sem await/fetch e sem atrasar o redirect.
            event.preventDefault();
            const trackingUrl = buildTrackingRedirectHref();
            window.location.assign(trackingUrl);
          }}
          id="btn-vip"
          className="private-btn-glow mx-auto block w-full max-w-sm rounded-2xl bg-pink-600 px-5 py-5 text-xl font-black uppercase tracking-tight text-white transition-all hover:bg-pink-500 active:scale-[0.98] sm:py-6 sm:text-2xl"
        >
          Quero ver tudo agora 🔥
        </a>

        <div className="mt-10 -mx-3 flex justify-center gap-1.5 sm:mx-0 sm:gap-3">
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
