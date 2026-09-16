import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import mayaAsset from "@/assets/maya.jpg.asset.json";

type ClientParamBuilder = {
  processAndCollectAllParams: (url?: string | null) => Promise<Record<string, string>>;
  getFbp: () => string;
  getFbc: () => string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    clientParamBuilder?: ClientParamBuilder;
  }
}

// Todo clique no CTA continua passando pelo Railway para criar/transportar
// o tracking antes de redirecionar o visitante ao Telegram.
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

function prepareMetaParamsNoWait(): void {
  if (typeof window === "undefined") return;

  const builder = window.clientParamBuilder;
  if (!builder) return;

  try {
    // Biblioteca oficial da Meta. Não aguardamos a Promise: segundo a própria
    // documentação, o _fbp é gravado antes da primeira operação assíncrona.
    // Assim, o clique continua imediato e não faz fetch/await antes do redirect.
    void builder.processAndCollectAllParams(window.location.href);
  } catch {
    // Tracking nunca pode impedir o CTA de funcionar.
  }
}

function getBuilderValue(kind: "fbp" | "fbc"): string | null {
  if (typeof window === "undefined") return null;

  const builder = window.clientParamBuilder;
  if (!builder) return null;

  try {
    const value = kind === "fbp" ? builder.getFbp() : builder.getFbc();
    return value || null;
  } catch {
    return null;
  }
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

  // Sinal real do clique recebido na URL quando a visita veio da Meta.
  const fbclid = urlParams.get("fbclid") || null;

  // Usa os IDs criados/gerenciados pela biblioteca oficial da Meta quando
  // disponível. Se ela ainda não carregou, faz fallback para os cookies reais.
  // Não fabricamos fbc/fbp manualmente nesta landing.
  const fbc = getBuilderValue("fbc") || getCookie("_fbc");
  const fbp = getBuilderValue("fbp") || getCookie("_fbp");

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
    // Dispara a coleta oficial da Meta assim que a página fica interativa, mas
    // sem aguardar nada. O CTA continua sem atraso.
    prepareMetaParamsNoWait();
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
            // Reforça a coleta oficial no exato momento do clique. Não usamos
            // await: o _fbp é disponibilizado sincronamente pelo Parameter Builder
            // antes da parte assíncrona, então o redirecionamento não espera rede.
            event.preventDefault();
            prepareMetaParamsNoWait();
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
