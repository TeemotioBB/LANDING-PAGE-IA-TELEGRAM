# Migração do Lovable para GitHub + Vercel

## O que foi preservado

- Pixel Meta existente: `1109117488437190`
- Evento `PageView` existente no `src/routes/__root.tsx`
- Endpoint real de tracking: `https://web-production-9d79b.up.railway.app/tracking/telegram/go`
- Captura de `fbclid`, `_fbc`, `_fbp`, `page_url` e `referrer`
- Clique no CTA continua passando primeiro pelo Railway e só depois pelo Telegram
- O fluxo do backend/CAPI não foi substituído pelo script simplificado do HTML de referência

## O que mudou

Somente a camada visual da rota principal (`src/routes/index.tsx`) e estilos complementares em `src/styles.css`.

## Deploy

1. Crie um repositório novo no GitHub.
2. Envie TODO o conteúdo desta pasta para a raiz do repositório.
3. Na Vercel, use **Add New > Project** e importe esse repositório.
4. A Vercel deve detectar `TanStack Start` automaticamente. O arquivo `vercel.json` também explicita o framework.
5. Faça o primeiro deploy.
6. Abra a URL pública com um parâmetro de teste, por exemplo `?fbclid=teste123`.
7. Clique no CTA e confira se a navegação começa por `/tracking/telegram/go` no domínio do Railway antes do Telegram.
8. Confirme o `PageView` no Meta Events Manager/Test Events.

## Sobre a foto da Maya

O ZIP original não contém o arquivo JPEG em si; ele contém `src/assets/maya.jpg.asset.json`, que aponta para o sistema de assets do Lovable.

Para ficar 100% independente do Lovable, depois coloque a foto real em `public/maya.jpg` e altere em `src/routes/index.tsx`:

```tsx
import mayaAsset from "@/assets/maya.jpg.asset.json";
```

removendo essa importação, e troque:

```tsx
src={mayaAsset.url}
```

por:

```tsx
src="/maya.jpg"
```

Até essa troca, a página continua usando a referência de asset que já existia no projeto.

## Não faça estas trocas

- Não substitua o CTA por `href="https://t.me/..."`.
- Não troque o Pixel real pelo `SEU_ID_DO_PIXEL` do HTML de referência.
- Não adicione um novo `fbq('track', 'Lead')` só porque ele aparecia no HTML de referência, a menos que você queira conscientemente alterar sua mensuração atual.
- Não remova a passagem pelo Railway, porque é ela que transporta os dados de atribuição usados no seu fluxo atual.
