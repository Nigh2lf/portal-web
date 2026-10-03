# portal-web

Front-end dos portais de imóveis (Petrópolis, Teresópolis, Juiz de Fora, Nova
Friburgo e Serra Imóveis) em **Next.js 16 (App Router) + React 19 + TypeScript +
Tailwind v4 + shadcn/ui**. Arquitetura e decisões em
[../ARQUITETURA.md](../ARQUITETURA.md).

## Rodar

```bash
npm install
cp .env.example .env.local   # DATA_SOURCE=mock por padrão
npm run dev                  # http://localhost:3000
```

Qualidade:

```bash
npx next typegen && npx tsc --noEmit && npm run lint
npm run build
```

## Fonte de dados

| `DATA_SOURCE` | Onde | Observação |
|---|---|---|
| `mock` (padrão) | `src/mocks/` | Dados determinísticos em memória; escritas valem até reiniciar o servidor. |
| `api` | `src/lib/api/http-repository.ts` | API Django em `API_BASE_URL`. Métodos ainda não implementados lançam erro explícito. |

Páginas **nunca** importam de `src/mocks`. Tudo passa por `getRepository()`
(`src/lib/api/index.ts`), que devolve a interface `PortalRepository`.

## Multi-portal

O portal é resolvido pelo host em `src/proxy.ts`. Em `localhost` use
`?portal=petropolis|teresopolis|juizdefora|novafriburgo|serra` (vira cookie) ou o
seletor no rodapé (só em desenvolvimento). O slug vai no header `x-portal-slug`
e `getPortal()` carrega a configuração. O tema muda via `data-portal` no `<html>`.

## Sessão mock

Login em `/anunciar` com o e-mail de qualquer anunciante mock e a senha
`123456`. Exemplos: `contato@timimoveis.com.br` (plano Max, com XML),
`contato@gelliconsultoria.com.br` (Prata), `contato@marcospereira.com.br`
(proprietário, plano grátis).

## Estrutura

```
src/
├── app/                 # rotas (App Router): (publico)/, (painel)/, api/
├── components/
│   ├── ui/              # shadcn (não editar à mão; use o CLI)
│   ├── layout/          # Container, Header, Footer, PageHeader
│   └── icons/
├── features/<feature>/  # components/, actions.ts, schemas.ts
├── lib/
│   ├── api/             # types.ts (contrato), repository.ts, index.ts, http-repository.ts
│   ├── auth/            # sessão (cookie)
│   ├── busca/           # parse/serialize de filtros da busca
│   ├── favoritos/       # cookie de favoritos
│   ├── seo/             # metadata e JSON-LD
│   ├── tenant/          # getPortal()
│   └── utils/           # formatação
├── config/redirects.ts  # URLs legadas -> novas (301 no proxy)
├── mocks/               # dados e repositório mock
└── proxy.ts             # tenant por host + redirects legados
```

## Convenções

- Server Components por padrão; `"use client"` só para interatividade.
- Mutations por server actions em `features/*/actions.ts`, retornando `ResultadoAcao`.
- Formulários com react-hook-form + zod; feedback com `sonner`.
- Campos da API em `snake_case` (não converter). Ids em string. Datas ISO.
- Texto em pt-BR. Sem comentários óbvios.
